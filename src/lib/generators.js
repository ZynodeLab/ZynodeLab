import { predictCreate2Address } from './create2.js';

export const GENERATOR_TARGETS = Object.freeze(['solidity', 'ethers', 'node', 'foundry']);

export function generateCreate2Code(target, recipe) {
  const result = predictCreate2Address(recipe);
  const { deployer, salt, initCodeHash } = result;

  if (target === 'solidity') {
    return `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\nfunction predict() pure returns (address) {\n    address deployer = ${deployer};\n    bytes32 salt = ${salt};\n    bytes32 initCodeHash = ${initCodeHash};\n    bytes32 digest = keccak256(abi.encodePacked(bytes1(0xff), deployer, salt, initCodeHash));\n    return address(uint160(uint256(digest)));\n}`;
  }

  if (target === 'ethers') {
    return `import { getCreate2Address } from "ethers";\n\nconst deployer = "${deployer}";\nconst salt = "${salt}";\nconst initCodeHash = "${initCodeHash}";\n\nconsole.log(getCreate2Address(deployer, salt, initCodeHash));`;
  }

  if (target === 'foundry') {
    return `// Foundry / Solidity\naddress deployer = ${deployer};\nbytes32 salt = ${salt};\nbytes32 initCodeHash = ${initCodeHash};\naddress predicted = address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), deployer, salt, initCodeHash)))));`;
  }

  if (target === 'node') {
    return `import { predictCreate2Address } from "zynode-lab";\n\nconst result = predictCreate2Address({\n  deployer: "${deployer}",\n  salt: "${salt}",\n  initCodeHash: "${initCodeHash}",\n});\n\nconsole.log(result.address);`;
  }

  throw new Error(`Unsupported target: ${target}. Use ${GENERATOR_TARGETS.join(', ')}.`);
}
