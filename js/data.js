// All portfolio content lives here, so text can be edited without touching the logic.

export const SUBTITLES = [
  '3-5 tahun ngoding, masih lapar belajar.',
  'Django, Flask, Laravel, Flutter.',
  'Scan dulu pakai OWASP ZAP, baru rilis.',
  'Bug yang masuk sini, pulang babak belur.',
  'Lagi belajar Docker, pentest, dan AI.',
];

export const JOURNEY = [
  { when: 'Kuliah', title: 'S1 Informatika', text: 'Skripsi berupa aplikasi mobile inventaris untuk toko kelontong, dengan stok yang tersimpan real-time di cloud.', tags: ['Flutter', 'Firestore'] },
  { when: 'Proyek web', title: 'Toko online dan sistem informasi', text: 'Website toko online dan sistem informasi berbasis web untuk mengelola data instansi.', tags: ['Laravel', 'MySQL'] },
  { when: 'Proyek mobile', title: 'Aplikasi Flutter', text: 'Aplikasi kasir, katalog dengan pemesanan, dan pelaporan lapangan yang dipakai langsung dari HP.', tags: ['Flutter', 'Dart'] },
  { when: 'Sekarang', title: 'IT Developer di Spindo', text: 'Membangun aplikasi internal: ALR untuk link akses ICT, inventaris aset IT, dan dashboard laporan untuk manajemen.', tags: ['Django', 'Python', 'PostgreSQL', 'OWASP ZAP'] },
];

export const ALR_ROWS = [
  { t: 'Portal HRIS', c: 'WEB', o: 'MBP', v: 'Public' }, { t: 'Core Switch L3', c: 'NETWORK', o: 'MBP', v: 'Private' },
  { t: 'SAP GUI Prod', c: 'APPLICATION', o: 'RNA', v: 'Public' }, { t: 'Firewall Cabang', c: 'NETWORK', o: 'RNA', v: 'Private' },
  { t: 'Panduan VPN', c: 'GENERAL', o: 'MBP', v: 'Public' }, { t: 'CCTV Gudang', c: 'WEB', o: 'DWI', v: 'Public' },
];
export const ALR_NOTES = {
  admin: '<b>Admin</b> bisa CRUD semua data Public milik siapa pun. Data Private tetap tertutup.',
  mbp: '<b>User Entry (MBP)</b> bisa CRUD data sendiri, Public maupun Private. Data Public orang lain hanya bisa dilihat dan disalin.',
  rna: '<b>User Entry (RNA)</b> punya aturan yang sama dari sisi RNA, jadi data Private milik MBP ikut tertutup.',
};

export const PROJECT_CATS = { kantor: 'Aplikasi kantor', web: 'Website', mobile: 'Mobile', kuliah: 'Kuliah' };
export const PROJECTS = [
  { c: 'kantor', t: 'ALR · Access Link Register', d: 'Web app yang menyatukan link akses ICT yang tersebar ke satu tempat. Login OTP, RBAC Public/Private, validasi link, export Excel, dan audit log.', tags: ['Python', 'PostgreSQL', 'Pytest', 'HTML/CSS/JS'], star: true, feat: ['Login email + OTP', 'RBAC Admin dan User Entry', 'Data Public / Private', 'Validasi dan cek duplikasi link', 'Workspace dan invite anggota', 'Audit log immutable'] },
  { c: 'kantor', t: 'Inventaris Aset IT', d: 'Mencatat dan melacak aset IT kantor, dari laptop dan printer sampai lisensi software.', tags: ['Django', 'Python'] },
  { c: 'kantor', t: 'Dashboard Laporan', d: 'Merangkum data jadi rekap dan grafik supaya manajemen bisa membaca kondisi dengan cepat.', tags: ['Django', 'Python'] },
  { c: 'web', t: 'Toko Online', d: 'Menampilkan katalog produk dan mengelola pesanan.', tags: ['Laravel', 'MySQL'] },
  { c: 'web', t: 'Sistem Informasi', d: 'Mengelola data instansi seperti sekolah atau klinik.', tags: ['Laravel', 'MySQL'] },
  { c: 'mobile', t: 'Aplikasi Kasir (POS)', d: 'Mencatat transaksi penjualan langsung dari HP.', tags: ['Flutter'] },
  { c: 'mobile', t: 'Katalog dan Pemesanan', d: 'Katalog produk dengan alur pemesanan di dalamnya.', tags: ['Flutter'] },
  { c: 'mobile', t: 'Pelaporan Lapangan', d: 'Mengirim laporan kegiatan langsung dari lapangan.', tags: ['Flutter'] },
  { c: 'kuliah', t: 'Skripsi: Inventaris Toko Kelontong', d: 'Mencatat stok barang toko kelontong, tersinkron real-time di cloud.', tags: ['Flutter', 'Firestore'] },
];

export const FINDINGS = [
  ['high', 'Cross Site Scripting (Reflected)'], ['high', 'SQL Injection'], ['med', 'Content Security Policy tidak diset'],
  ['med', 'Tidak ada batas percobaan login'], ['low', 'Cookie tanpa flag HttpOnly'],
];

export const STEPS = [
  { t: 'Requirement', h: 'Baca requirement', p: 'Tugas dikaitkan ke nomor SR yang relevan. Tujuannya jelas dulu sebelum menulis kode.', code: 'SR-06  validasi format url (http/https)\nSR-06  deteksi duplikasi url/address/port\nSR-07  ekstensi jpg/png/pdf, max 10MB' },
  { t: 'Schema', h: 'Rancang schema', p: 'Tabel snake_case plural, model PascalCase singular, primary key id, foreign key nama_entitas_id.', code: 'class AccessEntry(models.Model):\n    category = models.ForeignKey(Category, on_delete=models.PROTECT)\n    title = models.CharField(max_length=150)\n    is_active = models.BooleanField(default=True)' },
  { t: 'Logika', h: 'Logika bisnis dan RBAC', p: 'Validasi dan aturan akses ditaruh di services, bukan di routes. Satu fungsi, satu tugas.', code: 'def can_edit_entry(user, entry) -> bool:\n    if user.role == "admin":\n        return entry.visibility == "public"\n    return entry.created_by_id == user.id' },
  { t: 'Testing', h: 'Tulis test', p: 'Setiap aturan punya skenario positive dan negative.', code: 'def test_admin_cannot_edit_private_entry():\n    entry = make_entry(visibility="private")\n    assert not can_edit_entry(admin_user, entry)' },
  { t: 'Commit', h: 'Commit per milestone', p: 'Satu milestone selesai, satu commit, pakai Conventional Commits.', code: 'git add .\ngit commit -m "feat: tambah validasi duplikasi url"\ngit push origin feature/validasi-url' },
];

export const TESTS = ['test_login_email_korporat_valid', 'test_otp_kadaluarsa_ditolak', 'test_admin_tidak_lihat_data_private', 'test_user_entry_readonly_public_orang_lain', 'test_url_tanpa_http_ditolak', 'test_duplikasi_url_terdeteksi', 'test_audit_log_tidak_bisa_diubah'];

export const COMMIT_TYPES = ['feat', 'fix', 'docs', 'test', 'refactor', 'style', 'chore'];
export const COMMIT_RULES = [
  ['type tanpa scope', () => true],
  ['deskripsi tidak kosong', d => d.trim().length > 0],
  ['huruf kecil di awal', d => !!d.trim() && d.trim()[0] === d.trim()[0].toLowerCase()],
  ['tanpa titik di akhir', d => !/\.\s*$/.test(d)],
  ['maksimal 50 karakter', d => d.trim().length <= 50],
];

export const STACK = [
  { id: 'backend', name: 'Backend', items: [
    ['Python', 'Bahasa serbaguna yang mudah dibaca. Dipakai untuk backend, otomasi, analisis data, sampai testing.'],
    ['Django', 'Framework web Python yang lengkap: ORM, halaman admin, autentikasi, dan proteksi keamanan bawaan.'],
    ['Flask', 'Framework web Python yang ringan. Cocok untuk API dan aplikasi yang disusun modular sendiri.'],
    ['PHP', 'Bahasa server-side yang banyak dipakai untuk web dan jalan di hampir semua hosting.'],
    ['Laravel', 'Framework PHP modern: Eloquent ORM, routing, migrasi database, dan autentikasi siap pakai.'],
    ['CodeIgniter', 'Framework PHP yang ringan dan cepat dengan konfigurasi minim.'],
  ] },
  { id: 'frontend', name: 'Frontend dan mobile', items: [
    ['HTML / CSS / JS', 'Tiga bahasa dasar web: struktur, tampilan, dan interaksi di browser.'],
    ['Tailwind CSS', 'Framework CSS berbasis utility class, styling ditulis langsung di HTML.'],
    ['Flutter', 'Framework UI dari Google berbahasa Dart. Satu kode untuk Android, iOS, dan web.'],
  ] },
  { id: 'database', name: 'Database', items: [
    ['PostgreSQL', 'Database relasional open source yang kuat, mendukung transaksi dan tipe data seperti JSON.', 'db_mtoa_alr'],
    ['MySQL', 'Database relasional yang populer, cepat, dan ringan untuk aplikasi web.'],
    ['MongoDB', 'Database NoSQL berbasis dokumen. Strukturnya fleksibel dan mudah berubah.'],
    ['Firestore', 'Database NoSQL di cloud dari Firebase. Datanya tersinkron real-time.'],
  ] },
  { id: 'quality', name: 'Testing dan keamanan', items: [
    ['Pytest', 'Framework testing Python. Test ditulis sebagai fungsi biasa dengan assert.'],
    ['OWASP ZAP', 'Tool open source untuk memindai celah keamanan web seperti XSS dan SQL injection.'],
  ] },
  { id: 'lang', name: 'Bahasa lainnya', items: [
    ['C++', 'Bahasa yang sangat cepat dan dekat ke hardware, untuk game dan sistem.'],
    ['C#', 'Bahasa dari Microsoft di platform .NET, untuk desktop, web ASP.NET, dan Unity.'],
  ] },
  { id: 'tools', name: 'Tools', items: [
    ['Git', 'Kontrol versi: kerja per branch dan bisa kembali ke versi lama.'],
    ['GitLab CI', 'Build dan test otomatis setiap kode di-push.'],
    ['PowerShell', 'Shell dan scripting Windows untuk otomasi tugas.'],
    ['VS Code', 'Code editor ringan dengan extension untuk hampir semua bahasa.'],
  ] },
];
