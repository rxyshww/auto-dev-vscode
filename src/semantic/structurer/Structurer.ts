import Parser, { Query } from "web-tree-sitter";

import { TSLanguage } from "../TreeSitterLanguage";
import { SupportedLanguage } from "../../language/SupportedLanguage";
import { CodeFile, CodeFunction, CodeStructure } from "../../codemodel/CodeFile";
import { TSLanguageService } from "../../language/service/TSLanguageService";
import { TSLanguageConfig } from "../langconfig/TSLanguageConfig";

export abstract class Structurer {
	protected parser: Parser | undefined;
	protected language: Parser.Language | undefined;
	protected abstract langId: SupportedLanguage;
	protected config: TSLanguageConfig | undefined;

	async init(langService: TSLanguageService): Promise<Query | undefined> {
		const tsConfig = TSLanguage.fromId(this.langId)!!;
		const _parser = langService.getParser() ?? new Parser();
		const language = await tsConfig.grammar(langService, this.langId);
		_parser.setLanguage(language);
		this.parser = _parser;
		this.language = language;
		return language?.query(tsConfig.structureQuery.scopeQuery);
	}

	async parseFile(code: string): Promise<CodeFile | undefined> {
		return undefined;
	}

	protected insertLocation(model: CodeStructure, node: Parser.SyntaxNode) {
		model.start = { row: node.startPosition.row, column: node.startPosition.column };
		model.end = { row: node.endPosition.row, column: node.endPosition.column };
	}

	protected createFunction(capture: Parser.QueryCapture, text: string): CodeFunction {
		const functionObj: CodeFunction = {
			vars: [],
			name: text,
			start: { row: 0, column: 0 },
			end: { row: 0, column: 0 }
		};

		const node = capture.node.parent ?? capture.node;
		functionObj.start = { row: node.startPosition.row, column: node.startPosition.column };
		functionObj.end = { row: node.endPosition.row, column: node.endPosition.column };
		return functionObj;
	}
}