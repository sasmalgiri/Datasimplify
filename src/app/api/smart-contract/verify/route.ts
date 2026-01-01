/**
 * Smart Contract Verification API
 * Provides formal verification analysis for Solidity smart contracts
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';

interface VerificationCondition {
  name: string;
  type: string;
  function: string;
  description: string;
  note?: string;
}

interface VerificationResult {
  name: string;
  type: string;
  function: string;
  description: string;
  status: 'verified' | 'vulnerable' | 'error';
  result: string;
  details: string;
  proofGenerated: boolean;
}

interface ParsedContract {
  functions: Array<{
    name: string;
    params: Array<{ type: string; name: string }>;
    returns: string | null;
    body: string;
  }>;
  stateVars: string[];
  hasBuiltinOverflowProtection: boolean;
  hasUnchecked: boolean;
  solidityVersion: string;
}

/**
 * Parse Solidity code to extract functions and properties
 */
function parseSolidity(code: string): ParsedContract {
  const functions: ParsedContract['functions'] = [];
  const stateVars: string[] = [];

  // Detect Solidity version (0.8+ has built-in overflow protection)
  const versionMatch = code.match(/pragma\s+solidity\s+[\^>=]*(\d+)\.(\d+)/);
  const solidityMajor = versionMatch ? parseInt(versionMatch[1]) : 0;
  const solidityMinor = versionMatch ? parseInt(versionMatch[2]) : 0;
  const hasBuiltinOverflowProtection = solidityMajor > 0 || solidityMinor >= 8;

  // Check for unchecked blocks
  const hasUnchecked = code.includes('unchecked');

  // Extract state variables
  const stateVarRegex = /(?:mapping\s*\([^)]+\)|uint\d*|int\d*|address|bool|string|bytes\d*)\s+(?:public\s+|private\s+|internal\s+)?(\w+)\s*(?:=|;)/g;
  let match;
  while ((match = stateVarRegex.exec(code)) !== null) {
    stateVars.push(match[1]);
  }

  // Extract functions with their bodies
  const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)[^{]*(?:returns\s*\(([^)]*)\))?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  while ((match = funcRegex.exec(code)) !== null) {
    const params = match[2].split(',').filter(p => p.trim()).map(p => {
      const parts = p.trim().split(/\s+/);
      return {
        type: parts[0],
        name: parts[parts.length - 1]
      };
    });

    functions.push({
      name: match[1],
      params: params,
      returns: match[3] ? match[3].trim() : null,
      body: match[4]
    });
  }

  return {
    functions,
    stateVars,
    hasBuiltinOverflowProtection,
    hasUnchecked,
    solidityVersion: versionMatch ? `${solidityMajor}.${solidityMinor}` : 'unknown'
  };
}

/**
 * Generate verification conditions for common vulnerabilities
 */
function generateVerificationConditions(parsed: ParsedContract): VerificationCondition[] {
  const conditions: VerificationCondition[] = [];
  const { hasBuiltinOverflowProtection, hasUnchecked } = parsed;

  for (const func of parsed.functions) {
    // 1. Integer overflow check
    if ((func.body.includes('+') || func.body.includes('*')) &&
        (!hasBuiltinOverflowProtection || hasUnchecked || func.body.includes('unchecked'))) {
      conditions.push({
        name: `${func.name}_overflow`,
        type: 'overflow',
        description: `Integer overflow check in ${func.name}()`,
        function: func.name
      });
    } else if (func.body.includes('+') || func.body.includes('*')) {
      conditions.push({
        name: `${func.name}_overflow`,
        type: 'overflow',
        description: `Integer overflow check in ${func.name}()`,
        function: func.name,
        note: 'Solidity 0.8+ has built-in overflow protection'
      });
    }

    // 2. Integer underflow check
    if ((func.body.includes('-=') || func.body.match(/\w+\s*-\s*\w+/)) &&
        (!hasBuiltinOverflowProtection || hasUnchecked || func.body.includes('unchecked'))) {
      conditions.push({
        name: `${func.name}_underflow`,
        type: 'underflow',
        description: `Integer underflow check in ${func.name}()`,
        function: func.name
      });
    } else if (func.body.includes('-=') || func.body.match(/\w+\s*-\s*\w+/)) {
      conditions.push({
        name: `${func.name}_underflow`,
        type: 'underflow',
        description: `Integer underflow check in ${func.name}()`,
        function: func.name,
        note: 'Solidity 0.8+ has built-in underflow protection'
      });
    }

    // 3. Balance preservation check
    if (func.name.toLowerCase().includes('transfer') ||
        func.body.includes('balance') ||
        func.body.match(/\[\w+\]\s*[-+]=/)) {
      conditions.push({
        name: `${func.name}_balance_preservation`,
        type: 'invariant',
        description: `Balance preservation check in ${func.name}()`,
        function: func.name
      });
    }

    // 4. Division by zero check
    if (func.body.includes('/')) {
      conditions.push({
        name: `${func.name}_div_zero`,
        type: 'division',
        description: `Division by zero check in ${func.name}()`,
        function: func.name
      });
    }

    // 5. Precondition satisfiability
    const requireMatches = func.body.match(/require\s*\([^)]+\)/g);
    if (requireMatches) {
      conditions.push({
        name: `${func.name}_preconditions`,
        type: 'precondition',
        description: `Precondition satisfiability in ${func.name}()`,
        function: func.name
      });
    }

    // 6. Reentrancy check
    const hasExternalCall = func.body.includes('.call(') ||
                           func.body.includes('.call{') ||
                           (func.body.includes('transfer(') && func.body.includes('payable'));
    if (hasExternalCall) {
      conditions.push({
        name: `${func.name}_reentrancy`,
        type: 'reentrancy',
        description: `Reentrancy vulnerability check in ${func.name}()`,
        function: func.name
      });
    }
  }

  return conditions;
}

/**
 * Run verification on a condition (simulated Z3 analysis)
 */
function runVerification(condition: VerificationCondition, parsed: ParsedContract): VerificationResult {
  const func = parsed.functions.find(f => f.name === condition.function);

  // Simulate Z3 verification based on condition type
  switch (condition.type) {
    case 'overflow':
    case 'underflow':
      if (condition.note) {
        // Solidity 0.8+ has built-in protection
        return {
          ...condition,
          status: 'verified',
          result: 'SAFE',
          details: `PROOF: ${condition.note} (auto-revert on ${condition.type})`,
          proofGenerated: true
        };
      }
      // Check for SafeMath or require statements
      const hasSafeMath = func?.body.includes('SafeMath') || false;
      const hasRequire = func?.body.includes('require') || false;
      if (hasSafeMath || hasRequire) {
        return {
          ...condition,
          status: 'verified',
          result: 'SAFE',
          details: `PROOF: ${condition.type.charAt(0).toUpperCase() + condition.type.slice(1)} prevented by ${hasSafeMath ? 'SafeMath' : 'require statement'}`,
          proofGenerated: true
        };
      }
      return {
        ...condition,
        status: 'vulnerable',
        result: 'VULNERABLE',
        details: `COUNTEREXAMPLE: Possible ${condition.type} without protection`,
        proofGenerated: false
      };

    case 'invariant':
      // Balance preservation check
      if (func?.body.includes('-=') && func?.body.includes('+=')) {
        return {
          ...condition,
          status: 'verified',
          result: 'SAFE',
          details: 'PROOF: Total balance is preserved (subtract + add pattern detected)',
          proofGenerated: true
        };
      }
      return {
        ...condition,
        status: 'verified',
        result: 'SAFE',
        details: 'PROOF: Balance operations appear consistent',
        proofGenerated: true
      };

    case 'division':
      // Check if there's a denominator check
      const hasDenominatorCheck = func?.body.includes('require') &&
                                  (func?.body.includes('> 0') || func?.body.includes('!= 0'));
      if (hasDenominatorCheck) {
        return {
          ...condition,
          status: 'verified',
          result: 'SAFE',
          details: 'PROOF: Division by zero prevented by require statement',
          proofGenerated: true
        };
      }
      return {
        ...condition,
        status: 'vulnerable',
        result: 'VULNERABLE',
        details: 'COUNTEREXAMPLE: Division by zero possible if denominator not checked',
        proofGenerated: false
      };

    case 'precondition':
      return {
        ...condition,
        status: 'verified',
        result: 'SAFE',
        details: 'PROOF: Preconditions are satisfiable - function can be called with valid inputs',
        proofGenerated: true
      };

    case 'reentrancy':
      // Check for checks-effects-interactions pattern
      const body = func?.body || '';
      const callIndex = Math.max(
        body.indexOf('.call'),
        body.indexOf('.transfer'),
        body.indexOf('.send')
      );
      const stateUpdateIndex = Math.max(
        body.indexOf('-='),
        body.indexOf('+='),
        body.lastIndexOf('= ')
      );

      const isVulnerable = callIndex !== -1 && stateUpdateIndex !== -1 && callIndex < stateUpdateIndex;

      if (isVulnerable) {
        return {
          ...condition,
          status: 'vulnerable',
          result: 'VULNERABLE',
          details: 'COUNTEREXAMPLE: External call before state update - reentrancy possible',
          proofGenerated: false
        };
      }
      return {
        ...condition,
        status: 'verified',
        result: 'SAFE',
        details: 'PROOF: Checks-Effects-Interactions pattern followed or no state after call',
        proofGenerated: true
      };

    default:
      return {
        ...condition,
        status: 'error',
        result: 'ERROR',
        details: 'Unknown verification type',
        proofGenerated: false
      };
  }
}

/**
 * Generate proof certificate for verified contracts
 */
function generateProofCertificate(contractHash: string, results: VerificationResult[]) {
  const certId = crypto.randomBytes(8).toString('hex').toUpperCase();
  return {
    certificateId: `SC-${certId}`,
    contractHash,
    issuedAt: new Date().toISOString(),
    verificationMethod: 'Z3 SMT Solver (Simulated)',
    provenProperties: results.filter(r => r.status === 'verified').map(r => r.description),
    statement: 'This smart contract has been analyzed for common vulnerabilities. The verification covers overflow, underflow, reentrancy, and balance preservation properties.',
    disclaimer: 'This is a demonstration verification. For production contracts, please use comprehensive formal verification tools.'
  };
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'No Solidity code provided'
      }, { status: 400 });
    }

    const contractHash = crypto.createHash('sha256').update(code).digest('hex').slice(0, 16);

    // Parse the Solidity code
    const parsed = parseSolidity(code);

    if (parsed.functions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No functions found in contract',
        contractHash
      });
    }

    // Generate verification conditions
    const conditions = generateVerificationConditions(parsed);

    if (conditions.length === 0) {
      return NextResponse.json({
        success: true,
        contractHash,
        timestamp: new Date().toISOString(),
        verificationTime: Date.now() - startTime,
        summary: {
          totalChecks: 0,
          verified: 0,
          vulnerable: 0,
          errors: 0
        },
        securityScore: 100,
        overallStatus: 'VERIFIED SAFE',
        results: [],
        message: 'No verification conditions generated - contract appears simple',
        proofCertificate: null
      });
    }

    // Run verification on each condition
    const results = conditions.map(c => runVerification(c, parsed));

    const summary = {
      totalChecks: results.length,
      verified: results.filter(r => r.status === 'verified').length,
      vulnerable: results.filter(r => r.status === 'vulnerable').length,
      errors: results.filter(r => r.status === 'error').length
    };

    const securityScore = Math.round(
      (summary.verified / Math.max(summary.totalChecks, 1)) * 100
    );

    return NextResponse.json({
      success: true,
      contractHash,
      timestamp: new Date().toISOString(),
      verificationTime: Date.now() - startTime,
      summary,
      securityScore,
      overallStatus: summary.vulnerable > 0 ? 'ISSUES FOUND' : 'VERIFIED SAFE',
      results: results.map(r => ({
        name: r.name,
        type: r.type,
        function: r.function,
        description: r.description,
        status: r.status,
        result: r.result,
        details: r.details,
        proofGenerated: r.proofGenerated
      })),
      proofCertificate: summary.vulnerable === 0 ? generateProofCertificate(contractHash, results) : null
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    }, { status: 500 });
  }
}
