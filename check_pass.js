import bcrypt from 'bcryptjs';

const hash = '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
const passwords = ['password', '123456', 'admin', 'demo', 'secret'];

passwords.forEach(p => {
    if (bcrypt.compareSync(p, hash)) {
        console.log(`MATCH: ${p}`);
    } else {
        console.log(`NO MATCH: ${p}`);
    }
});
