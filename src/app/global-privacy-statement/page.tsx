export default function GlobalPrivacyStatementPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          Global Privacy Statement
        </h1>
        <p className="text-slate-600 mb-4">
          This statement explains how DentistBooking collects, uses, and protects
          personal data.
        </p>
        <div className="space-y-4 text-slate-700 text-sm leading-6">
          <p>
            We collect account data (such as name, email, and phone number) to
            provide booking and account management features.
          </p>
          <p>
            We use your information to operate the service, improve user
            experience, and support security and compliance requirements.
          </p>
          <p>
            You may request updates or deletion of personal data in accordance
            with applicable data protection laws.
          </p>
        </div>
      </div>
    </main>
  );
}
