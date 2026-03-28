# Havyn

Havyn is an Expo React Native app with a local Express backend for services like TTS.

## Project setup

This project has two parts:

- **Frontend:** Expo React Native app in the home `Havyn` directory
- **Backend:** Express server in the `server` directory

## Frontend setup

From the home `Havyn` directory, install frontend dependencies:

```bash
npm install
```

## Backend setup

From the home `Havyn` directory, move into the backend folder:

```bash
cd server
```

Install backend dependencies:

```bash
npm install
```

Create a `.env` file in the `server` directory:

```bash
touch .env
```

Then add the following to `server/.env`:

```env
PORT=3000
ELEVENLABS_API_KEY=YOUR-API-KEY
```

Replace `YOUR-API-KEY` with your actual ElevenLabs API key.

## Running the app

First, start the backend from the `server` directory:

```bash
npm run dev
```

Then, in a **separate terminal window**, go back to the home `Havyn` directory and start the frontend:

```bash
npx expo start
```

If you are not currently in the `server` directory, you can also open a new terminal directly in the home `Havyn` directory and run:

```bash
npx expo start
```

## Backend and frontend connection

When the backend is running locally on your Mac and the frontend is running in Expo, the frontend should be configured to point to the backend server.

Once the backend is running with:

```bash
npm run dev
```

and the frontend is running with:

```bash
npx expo start
```

the frontend and backend should now be connected.

## Notes

- Make sure your phone and computer are on the same Wi-Fi if testing on a physical device.
- Do not use `localhost` or `127.0.0.1` on a physical phone to reach the backend.
- Keep the backend running in one terminal and the Expo frontend running in another.
