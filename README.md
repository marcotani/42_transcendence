## Transcendence

Starta Docker:

```
sudo docker compose build
sudo docker compose up
```
sudo docker compose down

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

User alias chenge via curl
curl -X PATCH http://localhost:3000/users/"nome_utente"/alias \
  -H "Content-Type: application/json" \
  -d '{"alias": "new_alias"}'

Users visualizer
curl http://localhost:3000/api/users

Users stats visualizer 
curl -X GET http://localhost:3000/users | jq

Single user visualizer 
curl -X GET http://localhost:3000/users/"nome_utente" | jq

Cancella tutte le utenze nel database
curl -X DELETE http://localhost:3000/users

Elimina un utente specifico
curl -X DELETE http://localhost:3000/users/"nome_utente" \
  -H "Content-Type: application/json" \
  -d '{"password": "password_utente"}'