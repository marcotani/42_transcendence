## Transcendence

Starta Docker:

```
sudo docker compose build
sudo docker compose up
```

Backend disponibile a http://localhost:3000
Frontend disponibile a http://localhost:8080

User register via curl
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "email@example.com"
  }'

User login via curl
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

Users visualizer
curl http://localhost:3000/api/users

Cancella tutte le utenze nel database
curl -X DELETE http://localhost:3000/users

Elimina un utente specifico
curl -X DELETE http://localhost:3000/users/"nome_utente" \
  -H "Content-Type: application/json" \
  -d '{"password": "password_utente"}'