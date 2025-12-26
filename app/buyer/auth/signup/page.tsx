import type { Metadata } from "next"
import Link from "next/link"
import { BuyerSignupForm } from "@/components/buyer-signup-form"

export const metadata: Metadata = {
  title: "Buyer Signup",
  description: "Create your buyer account",
}

export default function BuyerSignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join as a Buyer</h1>
          <p className="text-gray-600">Create your account to start ordering</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <BuyerSignupForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/buyer/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Login
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/auth/signup" className="text-sm text-gray-500 hover:text-gray-700">
              Sign up as a supplier instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
