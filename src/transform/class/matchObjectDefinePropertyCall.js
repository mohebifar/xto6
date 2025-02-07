import {matches, extractAny} from 'f-matches';
import isFunctionProperty from './isFunctionProperty';

const matchObjectDefinePropertyCallOnPrototype = matches({
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'Identifier',
        name: 'Object'
      },
      property: {
        type: 'Identifier',
        name: 'defineProperty'
      }
    },
    arguments: [
      {
        type: 'MemberExpression',
        computed: false,
        object: {
          type: 'Identifier',
          name: extractAny('className')
        },
        property: {
          type: 'Identifier',
          name: 'prototype'
        }
      },
      {
        type: 'Literal',
        value: extractAny('methodName')
      },
      {
        type: 'ObjectExpression',
        properties: extractAny('properties')
      }
    ]
  }
});

const matchObjectDefinePropertyCall = matches({
  type: 'ExpressionStatement',
  expression: {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      computed: false,
      object: {
        type: 'Identifier',
        name: 'Object'
      },
      property: {
        type: 'Identifier',
        name: 'defineProperty'
      }
    },
    arguments: [
      {
        type: 'Identifier',
        name: extractAny('className')
      },
      {
        type: 'Literal',
        value: extractAny('methodName')
      },
      {
        type: 'ObjectExpression',
        properties: extractAny('properties')
      }
    ]
  }
});

export function isAccessorDescriptor(node) {
  return isFunctionProperty(node) &&
    (node.key.name === 'get' || node.key.name === 'set');
}

/**
 * Matches: Object.defineProperty(<className>.prototype, "<methodName>", {
 *              <kind>: <methodNode>,
 *              ...
 *          })
 *
 * When node matches returns the extracted fields:
 *
 * - className
 * - methodName
 * - descriptors:
 *     - propertyNode
 *     - methodNode
 *     - kind
 *
 * @param  {Object} node
 * @return {Object}
 */
export default function(node) {
  let {className, methodName, properties} = matchObjectDefinePropertyCallOnPrototype(node);

  let isStatic = false;
  if (!className) {
    ({className, methodName, properties} = matchObjectDefinePropertyCall(node));
    isStatic = true;
  }

  if (className) {
    return {
      className: className,
      methodName: methodName,
      descriptors: properties.filter(isAccessorDescriptor).map(prop => {
        return {
          propertyNode: prop,
          methodNode: prop.value,
          kind: prop.key.name,
        };
      }),
      static: isStatic
    };
  }
}
