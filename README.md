## Transcendence

Starta Docker:

```
sudo docker compose build
sudo docker compose up
```
sudo docker compose down

Backend disponibile a http://localhost:3000
Frontend disponibile a http://localhost:8080

----Comandi database----

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

Username change via curl
curl -X PATCH http://localhost:3000/users/vecchioUsername \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "passwordAttuale",
    "newUsername": "nuovoUsername"
  }'

Email change via curl
curl -X PATCH http://localhost:3000/users/vecchioUsername \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "passwordAttuale",
    "newEmail": "nuovaEmail@example.com"
  }'

Password change via curl
curl -X PATCH http://localhost:3000/users/vecchioUsername \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "passwordAttuale",
    "newPassword": "nuovaPassword"
  }'

Multi-field chenge via curl
curl -X PATCH http://localhost:3000/users/vecchioUsername \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "passwordAttuale",
    "newUsername": "nuovoUsername",
    "newEmail": "nuovaEmail@example.com",
    "newPassword": "nuovaPassword"
  }'

Upload nuova profile icon
curl -X PATCH http://localhost:3000/users/nome utente/avatar \
  -H "Content-Type: multipart/form-data" \
  -F "currentPassword=password_corrente" \
  -F "file=@emanuele-backend/uploads/nome file.png"

Reset profile icon
curl -X PATCH http://localhost:3000/users/nome utente/avatar/reset \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"password_corrente"}'

Inviare una richiesta di amicizia
curl -X POST http://localhost:3000/friends/requests \
  -H "Content-Type: application/json" \
  -d '{
    "fromUsername": "username_profilo",
    "currentPassword": "password_profilo_corrente",
    "toUsername": "username_amico"
  }' | jq

Accetta una richiesta di amicizia in attesa
curl -X POST http://localhost:3000/friends/requests/"id_della_richiesta"/accept \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nome_utente",
    "currentPassword": "password_utente"
  }' | jq

Rimuovi un utente dalla lista amici
curl -X DELETE http://localhost:3000/friends/nome_utente_da_rimuovere \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nome_utente",
    "currentPassword": "password_utente"
  }' | jq

Visualizza le richieste di amicizia in attesa 
curl -X GET "http://localhost:3000/friends/requests?for=nomeutente" | jq

Visualizza gli amici dell'utente
curl -X GET http://localhost:3000/friends/nome_utente | jq

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

------------------------
