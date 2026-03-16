'use client';

import Link from 'next/link';
import { Shield, Lock, GitBranch, Users, FileCheck, ExternalLink } from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function CodeSigningPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold">Code Signing Policy</h1>
        </div>
        <p className="text-gray-400 mb-10">
          CryptoReportKit Desktop is signed through{' '}
          <a
            href="https://signpath.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            SignPath Foundation
            <ExternalLink className="w-3 h-3" />
          </a>{' '}
          — a free code signing service for open-source projects.
        </p>

        {/* Signing Process */}
        <Section
          icon={<Lock className="w-5 h-5 text-emerald-400" />}
          title="Signing Process"
        >
          <ul className="space-y-3 text-gray-300">
            <li className="flex gap-2">
              <span className="text-emerald-400 mt-1">1.</span>
              <span>
                All releases are built exclusively through GitHub Actions on
                GitHub-hosted runners. No local builds are ever signed.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 mt-1">2.</span>
              <span>
                Build artifacts (EXE/MSI installers) are automatically submitted
                to SignPath for code signing after a successful CI build.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 mt-1">3.</span>
              <span>
                SignPath verifies that the binary was built from our public
                GitHub repository before signing with a trusted certificate.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-400 mt-1">4.</span>
              <span>
                Signed installers are published as GitHub Releases and on our{' '}
                <Link href="/desktop" className="text-emerald-400 hover:underline">
                  download page
                </Link>
                .
              </span>
            </li>
          </ul>
        </Section>

        {/* Certificate Details */}
        <Section
          icon={<FileCheck className="w-5 h-5 text-emerald-400" />}
          title="Certificate Details"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoRow label="Issuer" value="SignPath Foundation" />
            <InfoRow label="Subject" value="CryptoReportKit (Open Source)" />
            <InfoRow label="Type" value="Code Signing (Authenticode)" />
            <InfoRow label="Digest Algorithm" value="SHA-256" />
            <InfoRow label="Timestamp" value="DigiCert Timestamp Server" />
            <InfoRow label="Key Storage" value="Hardware Security Module (HSM)" />
          </div>
        </Section>

        {/* Build Integrity */}
        <Section
          icon={<GitBranch className="w-5 h-5 text-emerald-400" />}
          title="Build Integrity"
        >
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              Builds run only on GitHub-hosted runners (not self-hosted)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              Source code is public and auditable on GitHub
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              SignPath enforces origin verification before signing
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              No manual intervention between build and signing
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              Release artifacts match the exact commit tagged in git
            </li>
          </ul>
        </Section>

        {/* Team Roles */}
        <Section
          icon={<Users className="w-5 h-5 text-emerald-400" />}
          title="Team & Roles"
        >
          <p className="text-gray-300 mb-4">
            All team members with signing access use multi-factor authentication.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RoleCard
              role="Authors"
              description="Write code and submit pull requests"
            />
            <RoleCard
              role="Reviewers"
              description="Review PRs and approve code changes"
            />
            <RoleCard
              role="Approvers"
              description="Approve signing requests and manage releases"
            />
          </div>
        </Section>

        {/* Privacy & User Protection */}
        <Section
          icon={<Shield className="w-5 h-5 text-emerald-400" />}
          title="User Protection"
        >
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              The desktop app does not collect personal data or telemetry
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              API keys are stored locally in the OS keychain, never sent to our servers
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              The app does not modify system configuration without user consent
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              Standard uninstallation is supported via OS settings
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">&#10003;</span>
              See our{' '}
              <Link href="/privacy" className="text-emerald-400 hover:underline">
                Privacy Policy
              </Link>{' '}
              for full details
            </li>
          </ul>
        </Section>

        {/* Verification */}
        <div className="mt-12 p-6 bg-emerald-900/10 border border-emerald-500/20 rounded-xl">
          <h3 className="text-lg font-semibold mb-3">Verify a Download</h3>
          <p className="text-gray-300 text-sm mb-4">
            Right-click any downloaded <code className="text-emerald-400">.exe</code> or{' '}
            <code className="text-emerald-400">.msi</code> file, select{' '}
            <strong>Properties &rarr; Digital Signatures</strong> to verify the
            SignPath Foundation certificate.
          </p>
          <p className="text-gray-500 text-xs">
            Last updated: March 2026 &middot; Questions?{' '}
            <Link href="/contact" className="text-emerald-400 hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
      <span className="text-gray-500 text-xs uppercase tracking-wider block mb-1">
        {label}
      </span>
      <span className="text-gray-200">{value}</span>
    </div>
  );
}

function RoleCard({ role, description }: { role: string; description: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
      <h4 className="text-emerald-400 font-medium mb-1">{role}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
