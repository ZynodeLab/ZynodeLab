function escapeString(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

function byteArray(seed) {
  return seed.bytes ? [...seed.bytes].join(', ') : '';
}

function seedComment(seed) {
  const suffix = ['u16', 'u32', 'u64'].includes(seed.type) ? ` ${seed.endian?.toUpperCase() ?? 'LE'}` : '';
  return `${seed.type}${suffix}`;
}

function kitSeed(seed) {
  const value = escapeString(seed.value);
  if (seed.type === 'string') return `    "${value}"`;
  return `    Uint8Array.from([${byteArray(seed)}]) // ${seedComment(seed)}`;
}

function web3Seed(seed) {
  const value = escapeString(seed.value);
  if (seed.type === 'string') return `    Buffer.from("${value}")`;
  return `    Buffer.from([${byteArray(seed)}]) // ${seedComment(seed)}`;
}

function rustSeed(seed) {
  const value = escapeString(seed.value);
  if (seed.type === 'string') return `        b"${value}"`;
  return `        &[${byteArray(seed)}] // ${seedComment(seed)}`;
}

function anchorSeed(seed) {
  const value = escapeString(seed.value);
  if (seed.type === 'string') return `        b"${value}"`;
  return `        &[${byteArray(seed)}] // ${seedComment(seed)}`;
}

export function generateCode(kind, programId, seeds) {
  const safeProgram = escapeString(programId);

  if (kind === 'kit') {
    return `import { Address, getProgramDerivedAddress } from "@solana/kit";\n\nconst programAddress = "${safeProgram}" as Address;\n\nconst [pda, bump] = await getProgramDerivedAddress({\n  programAddress,\n  seeds: [\n${seeds.map(kitSeed).join(',\n')}\n  ],\n});\n\nconsole.log({ pda, bump });`;
  }

  if (kind === 'web3') {
    return `import { PublicKey } from "@solana/web3.js";\n\nconst programId = new PublicKey("${safeProgram}");\n\nconst [pda, bump] = PublicKey.findProgramAddressSync(\n  [\n${seeds.map(web3Seed).join(',\n')}\n  ],\n  programId,\n);\n\nconsole.log({ pda: pda.toBase58(), bump });`;
  }

  if (kind === 'rust') {
    return `use solana_program::pubkey::Pubkey;\nuse std::str::FromStr;\n\nlet program_id = Pubkey::from_str("${safeProgram}")?;\n\nlet (pda, bump) = Pubkey::find_program_address(\n    &[\n${seeds.map(rustSeed).join(',\n')}\n    ],\n    &program_id,\n);\n\nprintln!("PDA: {pda}, bump: {bump}");`;
  }

  return `// Exact-byte Anchor constraint for this PDA configuration.\n// Replace literal byte arrays with account/argument expressions when integrating.\n#[account(\n    seeds = [\n${seeds.map(anchorSeed).join(',\n')}\n    ],\n    bump\n)]\npub derived_account: Account<'info, DerivedAccount>,`;
}
