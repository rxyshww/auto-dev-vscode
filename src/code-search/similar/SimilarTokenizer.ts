export class SimilarTokenizer {
	// singletons
	private static instance_: SimilarTokenizer;

	static instance() {
		if (!this.instance_) {
			this.instance_ = new SimilarTokenizer();
		}
		return this.instance_;
	}

	private constructor() {
	}

	stopWords = ["we", "our", "you", "it", "its", "they", "them", "their", "this", "that", "these", "those", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "can", "don", "t", "s", "will", "would", "should", "what", "which", "who", "when", "where", "why", "how", "a", "an", "the", "and", "or", "not", "no", "but", "because", "as", "until", "again", "further", "then", "once", "here", "there", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "above", "below", "to", "during", "before", "after", "of", "at", "by", "about", "between", "into", "through", "from", "up", "down", "in", "out", "on", "off", "over", "under", "only", "own", "same", "so", "than", "too", "very", "just", "now"];
	programmingKeywords = ["if", "then", "else", "for", "while", "with", "def", "function", "return", "TODO", "import", "try", "catch", "raise", "finally", "repeat", "switch", "case", "match", "assert", "continue", "break", "const", "class", "enum", "struct", "static", "new", "super", "this", "var"];

	stopWordsSet = new Set([...this.stopWords, ...this.programmingKeywords]);

	/**
	 * since is slowly will tokenize, we revoke the same way will Copilot:
	 * https://github.com/mengjian-github/copilot-analysis#promptelement%E4%B8%BB%E8%A6%81%E5%86%85%E5%AE%B9
	 */
	tokenize(input: string): Set<string> {
		return new Set(this.splitIntoWords(input).filter(word => !this.stopWordsSet.has(word)));
	}

	splitIntoWords(input: string): string[] {
		return input.split(/[^a-zA-Z0-9]/).filter(word => word.length > 0);
	}
}