// Memberi tahu TypeScript bentuk data pengguna yang disimpan di sesi.
declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    email: string
    role: 'admin' | 'staff'
  }
}

export {}
