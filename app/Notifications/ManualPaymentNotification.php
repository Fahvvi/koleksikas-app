<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ManualPaymentNotification extends Notification
{
    use Queueable;

    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function via($notifiable)
    {
        // Kita simpan ke Database saja (nanti bisa tambah 'mail' atau 'broadcast')
        return ['database'];
    }

    public function toArray($notifiable)
    {
        return [
            'title' => 'Konfirmasi Bayar Manual',
            'message' => "Member {$this->data['user_name']} mengonfirmasi pembayaran untuk {$this->data['bill_name']}.",
            'amount' => $this->data['amount'],
            'transaction_id' => $this->data['transaction_id'],
            'type' => 'payment_confirmation',
            'icon' => '💳'
        ];
    }
}