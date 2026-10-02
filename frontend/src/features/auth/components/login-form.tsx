import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useLogin } from '../hooks/use-login'
import { loginSchema, type LoginValues } from '../schemas'

const resolver = zodResolver(loginSchema)
const defaultValues: LoginValues = { username: '', password: '' }

const errorMessage = (error: unknown) =>
  error instanceof ApiError && error.status < 500
    ? error.message
    : 'No pudimos conectar con el servidor. Intenta de nuevo.'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver, defaultValues, reValidateMode: 'onBlur' })

  // Al guardar el usuario, GuestOnly redirige al destino correcto
  const onSubmit = handleSubmit((values) => loginMutation.mutate(values))

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {loginMutation.isError ? (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage(loginMutation.error)}
        </div>
      ) : null}

      <FormField label="Usuario" error={errors.username?.message}>
        {(control) => (
          <Input
            {...control}
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
            {...register('username')}
          />
        )}
      </FormField>

      <FormField label="Contraseña" error={errors.password?.message}>
        {(control) => (
          <div className="relative">
            <Input
              {...control}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-12"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-md text-muted-foreground hover:text-primary"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        )}
      </FormField>

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? <Spinner className="size-4" label="Ingresando" /> : <LogIn />}
        Ingresar
      </Button>
    </form>
  )
}
