# Linux Setup & Run Guide

This guide is optimized for setting up and running the **Least Count** card game on Linux distributions (such as Ubuntu, Debian, Fedora, Arch Linux, etc.).

---

## 📋 1. Prerequisites (Node.js & npm)

On Linux, installing Node.js via the default package manager (`apt`, `dnf`) can sometimes install outdated versions or lead to npm permission issues. We highly recommend using **NVM (Node Version Manager)**.

### Option A: Install via NVM (Recommended)
1. Install NVM:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```
2. Restart your terminal or source your profile (`source ~/.bashrc` or `source ~/.zshrc`).
3. Install the latest LTS version of Node.js:
   ```bash
   nvm install --lts
   nvm use --lts
   ```

### Option B: Install via NodeSource (Ubuntu/Debian)
If you prefer standard apt packages:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 🛠️ 2. Install Dependencies

Install all root, client, and server dependencies in one step using the monorepo helper script:
```bash
npm run install-all
```

---

## 🚀 3. Start the Game

To launch both the server and client concurrently, run the following command in the project root:
```bash
npm start
```

Once running:
- **Client (Frontend)**: [http://localhost:5173/](http://localhost:5173/)
- **Server (Backend)**: [http://localhost:3000/](http://localhost:3000/)
- **Admin Dashboard**: [http://localhost:4000/](http://localhost:4000/)

---

## 📶 4. Play with Friends on the Same Wi-Fi (Linux Specifics)

To host the game so others on your local network can connect:

### Step 4.1: Find your local Linux IP Address
In your terminal, run:
```bash
hostname -I | awk '{print $1}'
```
*(This outputs your local IP address, e.g., `192.168.1.50`)*

### Step 4.2: Configure Firewall (UFW / Firewalld)
If you have a firewall enabled on Linux, you must allow incoming traffic to Vite (port `5173`) and Socket.io (port `3000`).

* **For UFW (Ubuntu/Debian)**:
  ```bash
  sudo ufw allow 5173/tcp
  sudo ufw allow 3000/tcp
  ```
* **For Firewalld (Fedora/RHEL)**:
  ```bash
  sudo firewall-cmd --add-port=5173/tcp --permanent
  sudo firewall-cmd --add-port=3000/tcp --permanent
  sudo firewall-cmd --add-port=4000/tcp --permanent
  sudo firewall-cmd --reload
  ```

### Step 4.3: Expose Server & Connect
1. Make sure `client/vite.config.ts` has `host: true` set in the `server` config block.
2. Restart the application: `npm start`
3. Share the client link with your friends (e.g. `http://192.168.1.50:5173/`).
4. Since the Socket connection in the client automatically connects to the server IP on port 3000, they will connect to your room instantly!

---

## 🔁 5. Run Automatically on System Boot (systemd)

To make the game and dashboard start automatically whenever your Linux machine boots up, you can use a user-level systemd service.

1. Ensure the directory exists:
   ```bash
   mkdir -p ~/.config/systemd/user/
   ```
2. Create a `least-count.service` file in that directory (`~/.config/systemd/user/least-count.service`):
   ```ini
   [Unit]
   Description=Least Count Multiplayer Game Service
   After=network.target

   [Service]
   Type=simple
   WorkingDirectory=/home/deepblue/ai/least-count
   Environment="PATH=/usr/local/bin:/usr/bin:/bin"
   ExecStart=/usr/bin/npm start
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=default.target
   ```
   *(Be sure to replace the `WorkingDirectory` and `ExecStart` paths with your actual paths if they differ)*
3. Enable and start the service:
   ```bash
   systemctl --user daemon-reload
   systemctl --user enable --now least-count.service
   ```
   Now the frontend, backend, and dashboard will auto-start in the background on every reboot!
