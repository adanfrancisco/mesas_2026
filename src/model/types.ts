export type Rol = 'titular' | 'acompaniante' | 'sin-rol'

export type Participacion = {
  nombre: string
  rol: Rol
}

export type Mesa = {
  fecha: string
  hora: string
  materia: string
  carrera: string
  participaciones: Participacion[]
  fila: number
}

export type DocenteCorreo = {
  nombre: string
  email: string
  fila: number
}
