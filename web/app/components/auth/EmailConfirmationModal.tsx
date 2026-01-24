"use client";

export default function EmailConfirmationModal({ email }: { email: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-8 w-[90%] max-w-sm text-center shadow-xl">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center">
          <span className="text-3xl">✉️</span>
        </div>

        <h2 className="text-xl font-semibold text-(--charcoal)">
          Email Confirmation
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          We sent a confirmation email to{" "}
          <span className="font-medium text-(--slateblue)">{email}</span>.
          <br />
          Please check your inbox to activate your account.
        </p>
      </div>
    </div>
  );
}
