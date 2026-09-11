# Deploy free vĩnh viễn lên Oracle Cloud (Always Free)

Mục tiêu: 1 link duy nhất `http://IP-MAY:5000` vừa mở web vừa chạy API + database.
Không cần tên miền, không tốn tiền, không lo ngủ như Render.

## Bước 0 — Chuẩn bị (anh tự làm, 10 phút)

- 1 email + 1 số điện thoại + 1 thẻ Visa (Oracle chỉ verify, gói Always Free không trừ tiền).
- Tài khoản GitHub đã có code (repo này).

## Bước 1 — Tạo tài khoản Oracle Cloud

1. Vào cloud.oracle.com → Sign Up → Country: Vietnam.
2. Chọn **Always Free** (đừng chọn trial trả phí).
3. Verify email + số điện thoại + thẻ → đăng nhập Console.

## Bước 2 — Tạo máy ảo free

1. Compute → Instances → Create instance.
2. Image: **Ubuntu 24.04 Minimal**, Shape: **Ampere A1.Flex** → kéo **4 OCPU, 24 GB RAM**.
3. Boot volume: 50 GB (trong hạn mức free).
4. Networking: VCN mặc định → **tick mở port 22**, SSH key: **Create new key pair → tải file .key về giữ kỹ**.
5. Bấm Create, chờ Running, copy **Public IP**.

## Bước 3 — Mở cổng 5000 trên Oracle

1. Vào VCN của máy → Security Lists → Default Security List → Add Ingress Rules:
   - Source: `0.0.0.0/0`, Protocol: TCP, Port: `5000`, cho phép.
2. (Cổng 22 đã mở sẵn để SSH.)

## Bước 4 — SSH vào máy và dựng (copy-paste)

```bash
ssh -i duong-dan-toi-file.key ubuntu@IP-MAY
curl -fsSL https://raw.githubusercontent.com/lehoangtung269/restaurant-booking/main/deploy/oracle-setup.sh -o setup.sh
bash setup.sh
```

Đăng xuất rồi đăng nhập lại 1 lần (để nhận quyền docker), sau đó:

```bash
cd ~/restaurant-booking
sudo docker compose up -d --build
curl localhost:5000/api/health
```

Thấy `{"status":"OK",...}` là sống. Mở trình duyệt: `http://IP-MAY:5000`.

## Bước 5 — Nạp data mẫu (chỉ lần đầu)

```bash
sudo docker compose exec api node db/seeds/seed_maison_edem.js
```

## Lệnh vận hành

```bash
sudo docker compose logs -f api     # xem log
sudo docker compose restart api     # restart web
sudo docker compose down            # tắt hết
cd ~/restaurant-booking && git pull && sudo docker compose up -d --build   # update code mới
```

## Lưu ý

- Lần đầu build khoảng 5–10 phút (máy ARM cài packages). Lần sau nhanh hơn nhiều.
- Mail thật đang tắt (`DISABLE_EMAIL=true`). Muốn gửi mail xác nhận thì thêm App Password Gmail vào compose rồi restart.
- Backup database: `sudo docker compose exec db pg_dump -U app restaurant_booking > backup.sql`.
- Đừng commit file `.env` lên git (đã chặn trong .gitignore).
