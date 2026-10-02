import { createUserSchema, editUserSchema, roleFormSchema } from './schemas'

const user = { username: 'ana', email: 'Ana@Cafe.SV ', typeId: '2', password: 'secreto' }

describe('esquemas de usuarios', () => {
  it('normaliza correo y rol', () => {
    expect(createUserSchema.parse(user)).toMatchObject({ email: 'ana@cafe.sv', typeId: 2 })
  })

  it('la contraseña es obligatoria al crear y opcional al editar', () => {
    expect(createUserSchema.safeParse({ ...user, password: '' }).success).toBe(false)
    expect(editUserSchema.parse({ ...user, password: '' }).password).toBe('')
    expect(editUserSchema.safeParse({ ...user, password: '123' }).success).toBe(false)
  })

  it('valida el nivel de permisos del rol', () => {
    expect(
      roleFormSchema.safeParse({ name: 'Barista', permissionLevel: '11', role: 'mesero' }).success,
    ).toBe(false)
    expect(
      roleFormSchema.parse({ name: 'Barista', permissionLevel: '4', role: 'mesero' }),
    ).toMatchObject({
      permissionLevel: 4,
    })
  })
})
