import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-alumni text-sm text-gray-500">
            © {new Date().getFullYear()} AI-assisted Diagnosis. Hackathon project.
          </p>
          <div className="flex gap-6">
            <Link
              to="/docs"
              className="font-alumni text-sm text-gray-600 hover:text-gray-900"
            >
              Документация
            </Link>
            <Link
              to="/about"
              className="font-alumni text-sm text-gray-600 hover:text-gray-900"
            >
              О команде
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
