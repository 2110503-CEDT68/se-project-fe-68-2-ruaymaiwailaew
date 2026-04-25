export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Terms</h1>
        <p className="text-slate-600 mb-4">
          These Terms govern the use of the DentistBooking platform.
        </p>
        <div className="space-y-4 text-slate-700 text-sm leading-6">
          <p>
            By creating an account, you agree to use the service lawfully and
            provide accurate account information.
          </p>
          <p>
            You are responsible for protecting your account credentials and all
            activities under your account.
          </p>
          <p>
            The platform may update these Terms from time to time. Continued use
            after updates means you accept the revised Terms.
          </p>
        </div>
      </div>
    </main>
  );
}
