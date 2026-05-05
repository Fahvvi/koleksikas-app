<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Daftar Hadir - {{ $session->name }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #842A3B; /* Sesuai warna KoleksiKas */
            padding-bottom: 10px;
        }
        .header h2 {
            margin: 0 0 5px 0;
            color: #842A3B;
            text-transform: uppercase;
        }
        .header p {
            margin: 2px 0;
            font-weight: bold;
            color: #555;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
            color: #333;
            font-weight: bold;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #777;
            text-align: right;
        }
    </style>
</head>
<body>

    <div class="header">
        <h2>Daftar Hadir Sesillll</h2>
        <p>{{ $session->name }}</p>
        <p>Lokasi: {{ $session->location }} | Waktu: {{ \Carbon\Carbon::parse($session->scheduled_at)->format('d M Y, H:i') }}</p>
        <p>Grup: {{ $session->group->name }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th width="5%" class="text-center">No</th>
                <th width="30%">Nama Member</th>
                <th width="25%">No. WhatsApp</th>
                <th width="15%" class="text-center">Status</th>
                <th width="25%" class="text-center">Paraf (Tanda Tangan)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($participants as $index => $p)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $p->user->name ?? 'User Tidak Diketahui' }}</td>
                <td>{{ $p->user->phone_wa ?? '-' }}</td>
                <td class="text-center">Lunas</td>
                <td></td> </tr>
            @empty
            <tr>
                <td colspan="5" class="text-center">Belum ada peserta yang mengonfirmasi kehadiran.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Dicetak otomatis oleh sistem <strong>KoleksiKas</strong> pada {{ now()->timezone('Asia/Jakarta')->format('d M Y, H:i') }} WIB
    </div>

</body>
</html>