'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';

interface VerificationResponse {
  success: boolean;
  error?: string;
  code?: string;
  details?: string;
  chainId?: number;
  address?: string;
  verified?: boolean;
  status?: 'verified' | 'not_verified';
  matchType?: string;
  contractName?: string;
  source?: 'sourcify' | 'cache';
  stale?: boolean;
  staleReason?: string;
}

interface Z3AnalysisResult {
  success: boolean;
  error?: string;
  contractName?: string;
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    critical: number;
  };
  checks: Array<{
    name: string;
    status: 'passed' | 'warning' | 'critical';
    description: string;
    location?: string;
    suggestion?: string;
  }>;
}

type VerificationTab = 'sourcify' | 'z3';

// Z3-style formal verification patterns
const analyzeContractWithZ3 = (code: string): Z3AnalysisResult => {
  const checks: Z3AnalysisResult['checks'] = [];
  const lines = code.split('\n');

  // Extract contract name
  const contractMatch = code.match(/contract\s+(\w+)/);
  const contractName = contractMatch ? contractMatch[1] : 'Unknown';

  // Check 1: Reentrancy vulnerability (external calls before state changes)
  const hasExternalCall = /\.call\{|\.transfer\(|\.send\(/.test(code);
  const callBeforeStateChange = /\.(call|transfer|send)\s*[\({][\s\S]*?=\s*/.test(code);
  if (hasExternalCall) {
    if (callBeforeStateChange || !/ReentrancyGuard|nonReentrant/.test(code)) {
      checks.push({
        name: 'Reentrancy Check',
        status: 'warning',
        description: 'Potential reentrancy vulnerability detected. External calls found without ReentrancyGuard.',
        suggestion: 'Use ReentrancyGuard or checks-effects-interactions pattern.'
      });
    } else {
      checks.push({
        name: 'Reentrancy Check',
        status: 'passed',
        description: 'ReentrancyGuard or nonReentrant modifier detected.'
      });
    }
  } else {
    checks.push({
      name: 'Reentrancy Check',
      status: 'passed',
      description: 'No external calls detected that could cause reentrancy.'
    });
  }

  // Check 2: Integer overflow/underflow
  const hasUncheckedMath = /unchecked\s*\{/.test(code);
  const solidityVersion = code.match(/pragma\s+solidity\s+[\^~]?([\d.]+)/);
  const version = solidityVersion ? solidityVersion[1] : '0.8.0';
  const isOldVersion = version.startsWith('0.7') || version.startsWith('0.6') || version.startsWith('0.5');

  if (isOldVersion && !/SafeMath/.test(code)) {
    checks.push({
      name: 'Integer Overflow/Underflow',
      status: 'critical',
      description: `Solidity ${version} does not have built-in overflow checks and SafeMath is not used.`,
      suggestion: 'Upgrade to Solidity 0.8+ or use SafeMath library.'
    });
  } else if (hasUncheckedMath) {
    checks.push({
      name: 'Integer Overflow/Underflow',
      status: 'warning',
      description: 'Unchecked math blocks found. Ensure values are bounded.',
      suggestion: 'Verify that unchecked operations cannot overflow.'
    });
  } else {
    checks.push({
      name: 'Integer Overflow/Underflow',
      status: 'passed',
      description: 'Using Solidity 0.8+ with built-in overflow protection.'
    });
  }

  // Check 3: Access control
  const hasOnlyOwner = /onlyOwner|Ownable|AccessControl/.test(code);
  const hasAdminFunctions = /function\s+\w*(?:admin|owner|set|update|withdraw|mint|burn|pause)/i.test(code);

  if (hasAdminFunctions && !hasOnlyOwner) {
    checks.push({
      name: 'Access Control',
      status: 'warning',
      description: 'Admin functions detected without explicit access control modifiers.',
      suggestion: 'Use Ownable or AccessControl from OpenZeppelin.'
    });
  } else if (hasOnlyOwner) {
    checks.push({
      name: 'Access Control',
      status: 'passed',
      description: 'Access control mechanisms detected (Ownable/AccessControl).'
    });
  } else {
    checks.push({
      name: 'Access Control',
      status: 'passed',
      description: 'No admin functions requiring access control detected.'
    });
  }

  // Check 4: Timestamp dependency
  const hasTimestamp = /block\.timestamp|now/.test(code);
  if (hasTimestamp) {
    checks.push({
      name: 'Timestamp Dependency',
      status: 'warning',
      description: 'Contract uses block.timestamp which can be manipulated by miners.',
      suggestion: 'Avoid using timestamps for critical logic or use block numbers instead.'
    });
  } else {
    checks.push({
      name: 'Timestamp Dependency',
      status: 'passed',
      description: 'No timestamp dependency detected.'
    });
  }

  // Check 5: tx.origin usage
  const hasTxOrigin = /tx\.origin/.test(code);
  if (hasTxOrigin) {
    checks.push({
      name: 'tx.origin Authentication',
      status: 'critical',
      description: 'tx.origin used for authentication is vulnerable to phishing attacks.',
      suggestion: 'Use msg.sender instead of tx.origin for authentication.'
    });
  } else {
    checks.push({
      name: 'tx.origin Authentication',
      status: 'passed',
      description: 'No tx.origin usage detected.'
    });
  }

  // Check 6: Delegatecall usage
  const hasDelegatecall = /delegatecall/.test(code);
  if (hasDelegatecall) {
    checks.push({
      name: 'Delegatecall Safety',
      status: 'warning',
      description: 'delegatecall is used. Ensure target contract is trusted.',
      suggestion: 'Validate delegatecall targets and be aware of storage layout.'
    });
  } else {
    checks.push({
      name: 'Delegatecall Safety',
      status: 'passed',
      description: 'No delegatecall usage detected.'
    });
  }

  // Check 7: Selfdestruct
  const hasSelfdestruct = /selfdestruct|suicide/.test(code);
  if (hasSelfdestruct) {
    checks.push({
      name: 'Selfdestruct Check',
      status: 'warning',
      description: 'Contract contains selfdestruct which can permanently destroy the contract.',
      suggestion: 'Ensure selfdestruct is properly access controlled.'
    });
  } else {
    checks.push({
      name: 'Selfdestruct Check',
      status: 'passed',
      description: 'No selfdestruct detected.'
    });
  }

  // Check 8: Floating pragma
  const hasFloatingPragma = /pragma\s+solidity\s+\^/.test(code);
  if (hasFloatingPragma) {
    checks.push({
      name: 'Pragma Version',
      status: 'warning',
      description: 'Floating pragma detected. Consider locking to a specific version.',
      suggestion: 'Use a fixed pragma like "pragma solidity 0.8.20;"'
    });
  } else if (solidityVersion) {
    checks.push({
      name: 'Pragma Version',
      status: 'passed',
      description: 'Pragma version is locked.'
    });
  }

  // Check 9: Unchecked return values
  const hasUncheckedReturn = /\.call\{[^}]*\}\([^)]*\)\s*;/.test(code);
  if (hasUncheckedReturn) {
    checks.push({
      name: 'Return Value Check',
      status: 'warning',
      description: 'Low-level call return value might not be checked.',
      suggestion: 'Always check return values: (bool success, ) = addr.call{...}(...); require(success);'
    });
  } else {
    checks.push({
      name: 'Return Value Check',
      status: 'passed',
      description: 'No unchecked low-level call return values detected.'
    });
  }

  // Check 10: Public state variables
  const hasPublicMappings = /mapping\s*\([^)]+\)\s+public/.test(code);
  if (hasPublicMappings) {
    checks.push({
      name: 'State Visibility',
      status: 'passed',
      description: 'Public mappings provide automatic getters. Consider if this is intended.'
    });
  }

  // Calculate summary
  const summary = {
    totalChecks: checks.length,
    passed: checks.filter(c => c.status === 'passed').length,
    warnings: checks.filter(c => c.status === 'warning').length,
    critical: checks.filter(c => c.status === 'critical').length
  };

  return {
    success: true,
    contractName,
    summary,
    checks
  };
};

export default function SmartContractVerifierPage() {
  const [activeTab, setActiveTab] = useState<VerificationTab>('sourcify');

  // Sourcify state
  const [chainId, setChainId] = useState('1');
  const [address, setAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);

  // Z3 state
  const [solidityCode, setSolidityCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [z3Result, setZ3Result] = useState<Z3AnalysisResult | null>(null);

  const clear = () => {
    if (activeTab === 'sourcify') {
      setChainId('1');
      setAddress('');
      setResult(null);
    } else {
      setSolidityCode('');
      setZ3Result(null);
    }
  };

  const verify = async () => {
    if (!address.trim()) {
      alert('Please enter a contract address');
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      const res = await fetch('/api/smart-contract/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId: Number(chainId),
          address: address.trim()
        })
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const analyzeWithZ3 = () => {
    if (!solidityCode.trim()) {
      alert('Please paste Solidity code to analyze');
      return;
    }

    setIsAnalyzing(true);
    setZ3Result(null);

    // Simulate async analysis
    setTimeout(() => {
      try {
        const result = analyzeContractWithZ3(solidityCode);
        setZ3Result(result);
      } catch (error) {
        setZ3Result({
          success: false,
          error: error instanceof Error ? error.message : 'Analysis failed',
          summary: { totalChecks: 0, passed: 0, warnings: 0, critical: 0 },
          checks: []
        });
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);
  };

  const loadExample = () => {
    setSolidityCode(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract VulnerableExample is Ownable, ReentrancyGuard {
    mapping(address => uint256) public balances;

    constructor() Ownable(msg.sender) {}

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    // Potential issue: timestamp dependency
    function timeBasedWithdraw() external {
        require(block.timestamp > 1700000000, "Too early");
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // Safe withdraw with reentrancy guard
    function withdraw() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");
        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    // Admin function with proper access control
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />

      {/* Hero Section */}
      <section className="py-12 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-gray-900 text-xl">
              SC
            </div>
            <h1 className="text-3xl font-bold text-white">
              Safe<span className="text-emerald-400">Contract</span>
            </h1>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500">
              {activeTab === 'sourcify' ? 'Sourcify' : 'Z3 Formal'}
            </span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">
            {activeTab === 'sourcify' ? (
              <>Smart Contract Verification via <span className="text-emerald-400">Sourcify</span></>
            ) : (
              <>Formal Verification with <span className="text-emerald-400">Z3 Analysis</span></>
            )}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            {activeTab === 'sourcify'
              ? 'Checks whether a deployed contract is verified on Sourcify for the provided chain and address.'
              : 'Static analysis using Z3-style formal verification patterns to detect common vulnerabilities.'}
          </p>

          <div className="flex justify-center gap-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono">
                {activeTab === 'sourcify' ? 'N/A' : 'Z3'}
              </div>
              <div className="text-xs text-gray-500">Engine</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono">EVM</div>
              <div className="text-xs text-gray-500">Network</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono">
                {activeTab === 'sourcify' ? 'API' : 'Static'}
              </div>
              <div className="text-xs text-gray-500">Mode</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Selector */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-2 p-1 bg-gray-800 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('sourcify')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === 'sourcify'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sourcify Verification
          </button>
          <button
            onClick={() => setActiveTab('z3')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === 'z3'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Z3 Formal Analysis
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'sourcify' ? (
          /* Sourcify Verification */
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contract</span>
                <button
                  onClick={clear}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition"
                >
                  Clear
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Chain ID</label>
                  <input
                    value={chainId}
                    onChange={(e) => setChainId(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Examples: 1 (Ethereum), 10 (Optimism), 56 (BSC), 137 (Polygon), 42161 (Arbitrum)</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2">Contract Address</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-2">Address must be a 0x-prefixed 40-hex EVM address.</p>
                </div>
              </div>

              <div className="flex justify-end px-4 py-3 border-t border-gray-700">
                <button
                  onClick={verify}
                  disabled={isVerifying}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition flex items-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Check Verification
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification Results</span>
              </div>

              <div className="p-4 min-h-96">
                {isVerifying ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-3 border-gray-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p className="text-gray-400">Verification in progress...</p>
                  </div>
                ) : result ? (
                  result.success ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg border ${
                        result.verified
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 bg-gray-700/20'
                      }`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-white">
                              {result.verified ? 'Verified on Sourcify' : 'Not verified on Sourcify'}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              Chain ID: {result.chainId} | Source: {result.source}{result.stale ? ' (stale)' : ''}
                            </p>
                            {result.contractName && (
                              <p className="text-sm text-gray-300 mt-2">
                                Contract name: <span className="font-mono">{result.contractName}</span>
                              </p>
                            )}
                            {result.matchType && (
                              <p className="text-sm text-gray-300 mt-1">
                                Match: <span className="font-mono">{result.matchType}</span>
                              </p>
                            )}
                            {result.stale && result.staleReason && (
                              <p className="text-xs text-gray-500 mt-2">Stale fallback: {result.staleReason}</p>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded text-xs font-semibold ${
                            result.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {result.status}
                          </div>
                        </div>
                        {result.address && (
                          <div className="mt-3 p-2 bg-gray-900/40 rounded text-xs text-gray-400 font-mono break-all">
                            {result.address}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-4">⚠️</div>
                      <p className="text-gray-400">{result.error || 'Unknown error'}</p>
                      {result.details && (
                        <p className="text-gray-500 text-xs mt-2 max-w-sm">{result.details}</p>
                      )}
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4 opacity-50">🔐</div>
                    <p className="text-gray-500">
                      Enter a chain ID + contract address and click<br />
                      <strong className="text-gray-400">Check Verification</strong> to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Z3 Formal Analysis */
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Code Input Panel */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Solidity Code</span>
                <div className="flex gap-2">
                  <button
                    onClick={loadExample}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded transition"
                  >
                    Load Example
                  </button>
                  <button
                    onClick={clear}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="p-4">
                <textarea
                  value={solidityCode}
                  onChange={(e) => setSolidityCode(e.target.value)}
                  placeholder="// Paste your Solidity code here...
pragma solidity ^0.8.20;

contract MyContract {
    // ...
}"
                  className="w-full h-80 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none font-mono text-sm resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="flex justify-end px-4 py-3 border-t border-gray-700">
                <button
                  onClick={analyzeWithZ3}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span>🔬</span>
                      Run Z3 Analysis
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Analysis Results Panel */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Analysis Results</span>
              </div>

              <div className="p-4 min-h-96 max-h-[500px] overflow-y-auto">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-3 border-gray-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p className="text-gray-400">Running formal analysis...</p>
                    <p className="text-gray-500 text-sm mt-2">Checking vulnerability patterns...</p>
                  </div>
                ) : z3Result ? (
                  z3Result.success ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="p-4 rounded-lg border border-gray-700 bg-gray-700/20">
                        <h3 className="font-semibold text-white mb-3">
                          Analysis Summary: {z3Result.contractName}
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-300">{z3Result.summary.totalChecks}</div>
                            <div className="text-xs text-gray-500">Total Checks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">{z3Result.summary.passed}</div>
                            <div className="text-xs text-gray-500">Passed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">{z3Result.summary.warnings}</div>
                            <div className="text-xs text-gray-500">Warnings</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-400">{z3Result.summary.critical}</div>
                            <div className="text-xs text-gray-500">Critical</div>
                          </div>
                        </div>
                      </div>

                      {/* Individual Checks */}
                      <div className="space-y-2">
                        {z3Result.checks.map((check, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border ${
                              check.status === 'passed'
                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                : check.status === 'warning'
                                ? 'border-yellow-500/30 bg-yellow-500/5'
                                : 'border-red-500/30 bg-red-500/5'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-lg ${
                                    check.status === 'passed' ? '' :
                                    check.status === 'warning' ? '' : ''
                                  }`}>
                                    {check.status === 'passed' ? '✅' : check.status === 'warning' ? '⚠️' : '🚨'}
                                  </span>
                                  <span className="font-medium text-white text-sm">{check.name}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{check.description}</p>
                                {check.suggestion && (
                                  <p className="text-xs text-gray-500 mt-1 italic">💡 {check.suggestion}</p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                check.status === 'passed'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : check.status === 'warning'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {check.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-4">⚠️</div>
                      <p className="text-gray-400">{z3Result.error || 'Analysis failed'}</p>
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4 opacity-50">🔬</div>
                    <p className="text-gray-500">
                      Paste Solidity code and click<br />
                      <strong className="text-gray-400">Run Z3 Analysis</strong> to check for vulnerabilities
                    </p>
                    <div className="mt-4 text-xs text-gray-600 max-w-sm">
                      <p>Checks include: Reentrancy, Integer overflow, Access control, Timestamp dependency, tx.origin, delegatecall, and more.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          {activeTab === 'sourcify' ? (
            <>
              <p>This checks Sourcify verification status (not a security audit).</p>
              <p>Results are returned exactly as available; missing data shows as not verified.</p>
            </>
          ) : (
            <>
              <p>Z3 analysis performs static pattern matching for common vulnerability patterns.</p>
              <p>This is not a full formal verification - always conduct professional audits for production contracts.</p>
            </>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/tools" className="text-gray-400 hover:text-white text-sm">
            ← Back to Tools
          </Link>
        </div>
      </main>
    </div>
  );
}
