import type { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/buyer-login-form"

export const metadata: Metadata = {
  title: "Buyer Login",
  description: "Login to your buyer account",
}

export default function BuyerLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login to your buyer account</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/buyer/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up as a buyer
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-700">
              Login as a supplier instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
