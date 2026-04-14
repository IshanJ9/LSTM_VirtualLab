# DL LSTM VL

An interactive XAI + LSTM lab built with a FastAPI backend and a React + Vite frontend. The app lets you explore simulated sequence datasets, inspect model behavior, and run counterfactual explanations through the browser UI.

## What You Need

- Python 3.10 or newer
- Node.js 18 or newer
- `pip` and `npm`

## Project Layout

- `backend/` contains the FastAPI API, dataset generation code, and precomputed simulation JSON files.
- `frontend/` contains the React UI and Vite dev server.

## Run From a Fresh Clone

1. Clone the repository and open the project root.
2. Set up the Python backend environment.
3. Install frontend dependencies.
4. Start the backend API.
5. Start the frontend dev server.

## Backend Setup

Open a terminal in the repository root and run:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
```

If PowerShell blocks script activation, run:

```powershell
Set-ExecutionPolicy -Scope Process RemoteSigned
```

### Optional: Regenerate the Dataset JSON Files

The repository already includes the generated JSON files in `backend/data/`. If you want to rebuild them, run:

```powershell
cd backend
python precompute.py
```

You can also regenerate a single dataset by passing its id:

```powershell
python precompute.py sine
python precompute.py noisy
python precompute.py text
python precompute.py long-range
```

## Start the Backend

From the `backend/` folder:

```powershell
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

## Frontend Setup

In a second terminal, install the frontend dependencies:

```powershell
cd frontend
npm install
```

## Start the Frontend

From the `frontend/` folder:

```powershell
npm run dev
```

Vite runs on `http://localhost:5173` by default. The frontend is already configured to proxy `/api` requests to the backend at `http://localhost:8000`, so no extra environment variables are required for local development.

## Verify It Works

Open the Vite URL in your browser and navigate through the app sections. The main routes are:

- `/aim`
- `/objectives`
- `/theory`
- `/simulation`
- `/analysis`
- `/quiz`

The frontend talks to these backend endpoints through the `/api` proxy:

- `GET /datasets`
- `GET /simulate?dataset=sine|noisy|text|long-range`
- `GET /analysis?dataset=sine|noisy|text|long-range`
- `POST /counterfactual`

## Common Issues

- If the frontend shows API errors, confirm the backend is running on port `8000`.
- If a dataset request returns `File not found`, regenerate the simulation files with `python precompute.py` from `backend/`.
- If PowerShell cannot activate the virtual environment, use the execution policy command shown above and try again.

## Notes

- Keep `backend/data/*.json` committed, because the app reads those files at runtime.
- Do not commit local environments such as `.venv/` or `frontend/node_modules/`.
