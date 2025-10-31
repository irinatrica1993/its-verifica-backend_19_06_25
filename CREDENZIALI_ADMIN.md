# 🔐 Credenziali Admin di Sistema

## Credenziali Fisse

Le seguenti credenziali admin sono **permanenti** e vengono automaticamente create/verificate ad ogni avvio del server:

```
Email:    admin@example.com
Password: password123
```

## Caratteristiche

- ✅ **Permanenti**: Non possono essere eliminate dal database
- ✅ **Auto-ripristino**: Se eliminate, vengono ricreate automaticamente all'avvio del server
- ✅ **Ruolo fisso**: Sempre impostato come `admin`
- ✅ **Accesso garantito**: Utilizzabili in qualsiasi momento

## Utilizzo

### Login Manuale
1. Vai alla pagina di login: `http://localhost:5173/login`
2. Inserisci:
   - Email: `admin@example.com`
   - Password: `password123`
3. Clicca su "Accedi"

### Login Rapido
1. Vai alla pagina di login
2. Clicca sul pulsante **"Accedi come Admin"**
3. Il form si compilerà automaticamente
4. Clicca su "Accedi"

## Sicurezza

⚠️ **IMPORTANTE PER LA PRODUZIONE:**

Queste credenziali sono adatte per **sviluppo e testing**. 

Per un ambiente di produzione, dovresti:
1. Cambiare la password in `src/utils/ensureAdmin.js`
2. Usare variabili d'ambiente per email e password
3. Implementare politiche di password più robuste
4. Abilitare l'autenticazione a due fattori

## File Coinvolti

- **Backend**: `/src/utils/ensureAdmin.js` - Logica di creazione/verifica admin
- **Backend**: `/index.js` - Chiamata alla funzione all'avvio
- **Frontend**: `/src/components/auth/LoginForm.jsx` - Pulsante "Accedi come Admin"

## Modifica delle Credenziali

Per modificare le credenziali fisse, edita il file:
```
/its-verifica-backend/src/utils/ensureAdmin.js
```

E cambia le costanti:
```javascript
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';
const ADMIN_NOME = 'Admin';
const ADMIN_COGNOME = 'Sistema';
```

Dopo la modifica, riavvia il server.
