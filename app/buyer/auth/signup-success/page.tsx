import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h1>

          <p className="text-gray-600 mb-6">
            We've sent a verification email to your inbox. Please verify your email address to complete your
            registration.
          </p>

          <Button asChild className="w-full">
            <Link href="/buyer/auth/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
