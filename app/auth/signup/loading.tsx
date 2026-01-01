export default function SignupLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 rounded-full border-4 border-t-primary border-slate-200 animate-spin"
          aria-hidden="true"
        />
        <div className="text-sm text-muted-foreground">Loading sign up…</div>
      </div>
    </div>
  )
}