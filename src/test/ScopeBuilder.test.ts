const Parser = require("web-tree-sitter");

import { ScopeBuilder } from "../codesearch/ScopeBuilder";
import { JavaLangConfig } from "../codecontext/java/JavaLangConfig";
import { TestLanguageService } from "./TestLanguageService";
import { TypeScriptLangConfig } from "../codecontext/typescript/TypeScriptLangConfig";

describe('ScopeBuilder', () => {
	let parser: any;
	let grammar: any;

	beforeEach(async () => {
		await Parser.init();
		parser = new Parser();
		const languageService = new TestLanguageService(parser);

		grammar = await TypeScriptLangConfig.grammar(languageService, "java")!!;
		parser.setLanguage(grammar);
	});

	it('build for scope', async () => {
		const javaHelloWorld = `
package com.example;

public class HelloWorld {
	public static void main(String[] args) {
		System.out.println("Hello, World!");
	}
}
`;

		const rootNode = parser.parse(javaHelloWorld).rootNode;

		// const query = grammar.query(JavaLangConfig.scopeQuery.queryStr);
		// let scopeBuilder = new ScopeBuilder(query!!, rootNode, javaHelloWorld, JavaLangConfig);
		// let output = await scopeBuilder.build();
		// console.log(output);
	});
});
