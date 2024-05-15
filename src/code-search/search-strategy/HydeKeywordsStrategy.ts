import { HydeQuery, HydeStrategy } from "./_base/HydeStrategy";
import { ChunkItem } from "../embedding/_base/Embedding";
import { HydeDocument, HydeDocumentType } from "./_base/HydeDocument";
import { PromptManager } from "../../prompt-manage/PromptManager";
import { TemplateContext } from "../../prompt-manage/template/TemplateContext";
import { HydeStep } from "./_base/HydeStep";
import { ChatMessage } from "../../llm-provider/ChatMessage";
import { QuestionKeywords } from "./utils/QuestionKeywords";
import { ContextItem, retrieveContextItems } from "../retrieval/DefaultRetrieval";
import { AutoDevExtension } from "../../AutoDevExtension";
import { CustomActionPrompt } from "../../prompt-manage/custom-action/CustomActionPrompt";
import { AutoDevStatus, AutoDevStatusManager } from "../../editor/editor-api/AutoDevStatusManager";
import { LlmProvider } from "../../llm-provider/LlmProvider";
import { channel } from "../../channel";
import { TextRange } from "../scope-graph/model/TextRange";

/**
 * Generate keywords from the query, and then used to retrieve similar code by symbols.
 *
 * Should set prioritize for the text code aka {@link TextDocument}.

 * - High: Current Document
 * - Medium: Recently Documents
 * - Low: All Documents
 */
export class HydeKeywordsStrategy implements HydeStrategy<QuestionKeywords> {
	documentType = HydeDocumentType.Keywords;
	message: ChatMessage[] = [];
	query: string;
	extension: AutoDevExtension;
	step: HydeStep;

	constructor(query: string, extension: AutoDevExtension) {
		this.query = query;
		this.extension = extension;
		this.step = HydeStep.Propose;
	}

	async instruction(): Promise<string> {
		let proposeContext: KeywordsProposeContext = {
			step: this.step,
			question: this.query,
			language: ""
		};

		return await PromptManager.getInstance().renderHydeTemplate(this.step, HydeDocumentType.Keywords, proposeContext);
	}

	async generateDocument(): Promise<HydeDocument<QuestionKeywords>> {
		let proposeIns = await this.instruction();

		let proposeOut = await HydeKeywordsStrategy.executeIns(proposeIns);
		let keywords = QuestionKeywords.from(proposeOut);
		return new HydeDocument<QuestionKeywords>(this.documentType, keywords);
	}

	async retrieveChunks(queryTerm: HydeQuery): Promise<ChunkItem[]> {
		let result: ContextItem[] = await retrieveContextItems(queryTerm as string, this.extension.ideAction, this.extension.embeddingsProvider!!, undefined);

		let chunks: ChunkItem[] = [];
		result.forEach((item: ContextItem) => {
			chunks.push({
				text: item.content,
				file: item.name,
				range: TextRange.empty(),
				embedding: []
			});
		});

		return chunks;
	}

	async clusterChunks(docs: ChunkItem[]): Promise<ChunkItem[]> {
		return docs;
	}

	async execute() {
		this.step = HydeStep.Propose;
		let documents = await this.generateDocument();
		let keywords = documents.content;

		this.step = HydeStep.Retrieve;
		let queryTerm = this.createQueryTerm(keywords);
		let chunks = await this.retrieveChunks(queryTerm);

		this.step = HydeStep.Evaluate;
		let evaluateContext: KeywordEvaluateContext = {
			step: this.step,
			question: keywords.question,
			code: chunks.map(item => item.text).join("\n"),
			language: ""
		};
		let evaluateIns = await PromptManager.getInstance().renderHydeTemplate(this.step, HydeDocumentType.Keywords, evaluateContext);
		return await HydeKeywordsStrategy.executeIns(evaluateIns);
	}

	private createQueryTerm(keywords: QuestionKeywords) {
		return keywords.basic?.[0] + " " + keywords.single?.[0] + " " + keywords.localization?.[0];
	}

	static async executeIns(instruction: string): Promise<string> {
		console.log("\ninstruction: \n\n" + instruction);
		channel.appendLine("\n");
		let result = "";
		try {
			let chatMessages = CustomActionPrompt.parseChatMessage(instruction);
			AutoDevStatusManager.instance.setStatus(AutoDevStatus.InProgress);
			let response = await LlmProvider.codeCompletion()._streamChat(chatMessages);
			for await (let chatMessage of response) {
				channel.append(chatMessage.content);
				result += chatMessage.content;
			}

			AutoDevStatusManager.instance.setStatus(AutoDevStatus.Done);

			return result;
		} catch (e) {
			console.log("error:" + e);
			AutoDevStatusManager.instance.setStatus(AutoDevStatus.Error);
			return "";
		}
	}
}

export interface KeywordsProposeContext extends TemplateContext {
	step: HydeStep,
	question: string,
}

export interface KeywordEvaluateContext extends TemplateContext {
	step: HydeStep,
	question: string,
	code: string,
}
