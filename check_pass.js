import bcrypt from 'bcryptjs';
const hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
const pass = 'password';
console.log('Match:', bcrypt.compareSync(pass, hash));
console.log('New Hash:', bcrypt.hashSync(pass, 10));
