import type { Rule } from 'eslint';
import type { CallExpression, MemberExpression } from 'estree';

const noResJson: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Replace res.status().json with ApiResponse.success',
    },
    fixable: 'code',
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node: CallExpression) {
        const callee = node.callee as MemberExpression;

        if (
          callee.type !== 'MemberExpression' ||
          callee.property.type !== 'Identifier' ||
          callee.property.name !== 'json'
        ) {
          return;
        }

        const sourceCode = context.sourceCode;

        let statusCode: string | number = 200;

        // detect res.status(...)
        if (
          callee.object &&
          callee.object.type === 'CallExpression' &&
          callee.object.callee.type === 'MemberExpression' &&
          callee.object.callee.property.type === 'Identifier' &&
          callee.object.callee.property.name === 'status'
        ) {
          const statusArg = callee.object.arguments[0];
          if (statusArg) {
            statusCode = sourceCode.getText(statusArg);
          }
        }

        const arg = node.arguments[0];
        if (!arg || arg.type !== 'ObjectExpression') return;

        let message = 'undefined';
        let data = 'undefined';

        for (const prop of arg.properties) {
          if (prop.type !== 'Property') continue;

          if (prop.key.type !== 'Identifier') continue;
          const key = prop.key.name;

          if (key === 'message') {
            message = sourceCode.getText(prop.value);
          }

          if (key === 'data') {
            data = sourceCode.getText(prop.value);
          }
        }

        context.report({
          node,
          message: 'Use ApiResponse.success instead of res.json',

          fix(fixer) {
            // @ts-expect-error - it will be present
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parent = node.parent as any;

            // ✅ only fix if already inside return
            if (!parent || parent.type !== 'ReturnStatement') {
              return null;
            }

            const newText = `return ApiResponse.success(res, {
  message: ${message},
  data: ${data},
  statusCode: ${statusCode}
})`;

            return fixer.replaceText(parent, newText);
          },
        });
      },
    };
  },
};

export default noResJson;
