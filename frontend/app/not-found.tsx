import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-gray-100">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-3 text-sm text-gray-400">
          The research workspace you are looking for is not available.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Back to research
        </Link>
      </div>
    </main>
  )
}
