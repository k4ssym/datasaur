import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { register as apiRegister } from '../services/api'
import { Button } from '../components/ui/Button'
import { NeuroOrbitAnimation } from '../components/auth/NeuroOrbitAnimation'

const STEPS = [
  { id: 1, title: 'Регистрация', subtitle: 'Введите ваши данные для создания аккаунта', fields: ['name', 'email'] },
  { id: 2, title: 'Создание пароля', subtitle: 'Придумайте надёжный пароль', fields: ['password', 'confirmPassword'] },
]

export function Register() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const checks = [
    { label: 'Минимум 8 символов', met: password.length >= 8 },
    { label: 'Одна буква', met: /[a-zA-Z]/.test(password) },
    { label: 'Одна цифра', met: /\d/.test(password) },
  ]

  const canProceedStep1 = name.trim().length > 0 && email.trim().length > 0
  const canProceedStep2 = password === confirmPassword && checks.every((c) => c.met)

  const handleNext = async () => {
    if (step === 1 && canProceedStep1) {
      setStep(2)
      setError('')
      return
    }
    if (step === 2 && canProceedStep2) {
      setError('')
      setLoading(true)
      try {
        const data = await apiRegister(email, password, name || undefined)
        login(
          { id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role },
          data.access_token
        )
        navigate('/dashboard')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка регистрации')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-8 overflow-hidden">
        <div className="flex-1 flex items-center justify-center min-h-0">
          <NeuroOrbitAnimation />
        </div>
        <p className="font-alumni text-white text-sm max-w-xs leading-relaxed">
          Платформа нового поколения для нейродиагностики с использованием искусственного интеллекта
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center p-8 lg:p-16 bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center gap-2 mb-12">
            <img src="/logo.png" alt="qaz.med" className="w-6 h-6" />
            <span className="font-aldrich text-gray-900 text-lg">qaz.med</span>
          </div>

          <div className="flex items-center gap-4 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-alumni text-sm font-bold ${
                    step >= s.id ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step > s.id ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    s.id
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-1 ${step > s.id ? 'bg-black' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <h1 className="font-aldrich text-2xl text-gray-900 mb-2">{STEPS[step - 1].title}</h1>
          <p className="font-alumni text-gray-600 mb-8">{STEPS[step - 1].subtitle}</p>

          <div className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <label className="block font-alumni text-sm text-gray-500 mb-1">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Имя"
                    className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none font-alumni text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-alumni text-sm text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none font-alumni text-gray-900"
                    required
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block font-alumni text-sm text-gray-500 mb-1">Пароль</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Пароль"
                      className="w-full px-0 py-2 pr-10 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none font-alumni text-gray-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {checks.map(({ label, met }) => (
                      <p key={label} className={`font-alumni text-sm flex items-center gap-2 ${met ? 'text-green-600' : 'text-red-600'}`}>
                        {met ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                        {label}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-alumni text-sm text-gray-500 mb-1">Подтвердите пароль</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Подтвердите пароль"
                      className="w-full px-0 py-2 pr-10 border-0 border-b border-gray-300 focus:border-gray-900 focus:ring-0 outline-none font-alumni text-gray-900"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <p className="font-alumni text-sm text-red-600 mt-4">{error}</p>
          )}
          <div className="flex gap-2 mt-8">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={() => { setStep(1); setError('') }}>
                Назад
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="rounded-xl"
              onClick={handleNext}
              disabled={loading || (step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
            >
              {step === 2 ? (loading ? 'Создание...' : 'Создать аккаунт →') : 'Далее →'}
            </Button>
          </div>

          <p className="mt-6 font-alumni text-sm text-gray-500">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-gray-900 font-medium hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
