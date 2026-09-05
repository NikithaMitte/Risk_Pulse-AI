import asyncio
import json
import logging
from typing import Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, SessionLocal
from .services.seed import seed_database
from .services.generator import generate_synthetic_transaction
from .schemas import TransactionOut, RiskAlertOut

from .api.auth import router as auth_router
from .api.dashboard import router as dashboard_router
from .api.transactions import router as transactions_router
from .api.alerts import router as alerts_router
from .api.intelligence import router as intelligence_router
from .api.audit import router as audit_router
from .api.settings import router as settings_router

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Seed initial database
db_session = SessionLocal()
try:
    seed_database(db_session)
finally:
    db_session.close()

app = FastAPI(
    title="RISKPULSE AI Backend API",
    description="Real-Time Payment Risk Intelligence & Fraud Prevention Platform Engine",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(transactions_router)
app.include_router(alerts_router)
app.include_router(intelligence_router)
app.include_router(audit_router)
app.include_router(settings_router)


# WebSocket Connection Manager & Background Monitor Task
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.is_monitoring: bool = False
        self.monitor_task: asyncio.Task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        if len(self.active_connections) == 0 and self.is_monitoring:
            self.stop_monitoring()

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        
        for conn in dead_connections:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

    def start_monitoring(self):
        if not self.is_monitoring:
            self.is_monitoring = True
            self.monitor_task = asyncio.create_task(self._simulation_loop())

    def stop_monitoring(self):
        self.is_monitoring = False
        if self.monitor_task:
            self.monitor_task.cancel()
            self.monitor_task = None

    async def _simulation_loop(self):
        while self.is_monitoring:
            try:
                await asyncio.sleep(3)  # Generate new txn every 3 seconds
                db = SessionLocal()
                try:
                    txn, assessment, alert = generate_synthetic_transaction(db)
                    txn_data = TransactionOut.model_validate(txn).model_dump(mode="json")
                    alert_data = RiskAlertOut.model_validate(alert).model_dump(mode="json") if alert else None

                    payload = {
                        "event": "NEW_TRANSACTION",
                        "transaction": txn_data,
                        "alert": alert_data,
                        "timestamp": txn.created_at.isoformat()
                    }
                    await self.broadcast(payload)
                finally:
                    db.close()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logging.error(f"Error in transaction simulation loop: {e}")
                await asyncio.sleep(3)


manager = ConnectionManager()


@app.websocket("/ws/risk-monitor")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial status
        await websocket.send_json({
            "event": "STATUS",
            "is_monitoring": manager.is_monitoring,
            "message": "Connected to RISKPULSE Real-Time Monitoring Sandbox"
        })

        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                action = msg.get("action")
                if action == "start_monitoring":
                    manager.start_monitoring()
                    await manager.broadcast({
                        "event": "MONITORING_STARTED",
                        "is_monitoring": True,
                        "message": "Live risk transaction streaming active"
                    })
                elif action == "stop_monitoring":
                    manager.stop_monitoring()
                    await manager.broadcast({
                        "event": "MONITORING_STOPPED",
                        "is_monitoring": False,
                        "message": "Live risk transaction streaming paused"
                    })
            except Exception as parse_err:
                print(f"WS message parse error: {parse_err}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.get("/")
def root():
    return {
        "platform": "RISKPULSE AI",
        "tagline": "Real-Time Payment Risk Intelligence & Fraud Prevention Platform",
        "status": "ONLINE",
        "environment": "SANDBOX / LIVE SIMULATION"
    }
