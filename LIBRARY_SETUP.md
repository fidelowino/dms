# 📚 Library Management System - Setup & Running Guide

## ✅ System Status: READY TO RUN

All components are installed and configured. The Library Management System is fully integrated into the Dawamu School Management System.

---

## 🚀 Quick Start

### 1. Install Dependencies (if needed)
```bash
cd /Users/iamfidelowino/dms.worktrees/agents-user-introduction-and-assistance
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will start on **http://localhost:3000**

### 3. Default Credentials

#### Librarian Account (NEW)
- **Role:** librarian
- **Password:** lib123

#### Admin Account (Existing)
- **Role:** admin
- **Password:** admin123

---

## 📚 Library Features

### For Librarian Role
✅ **Book Management**
- Add books to inventory (with code, title, author, quantity, location, supplier, cost)
- View all books in stock
- Track book details

✅ **Student Borrowing**
- Record when students borrow books
- Track student admission number, class, book title
- Automatic date stamping

✅ **Book Returns**
- View list of unreturned books
- Approve book returns when students return them
- Automatic return date and approver recording

✅ **Exercise Books**
- Track exercise book exchanges (square-ruled or single-lined)
- Record student name, class, type, quantity
- Keep notes on exchanges

✅ **Book Requisitions**
- Request books from suppliers
- Specify quantity, urgency, purpose
- Admin approves or rejects requests

✅ **Announcements**
- Post announcements visible to entire school

### For Admin Role
✅ **Library Dashboard**
- View unreturned books count
- View pending book requisitions count
- Real-time updates

✅ **Requisition Management**
- Approve or reject book requests from librarian
- Add notes to requests

✅ **Full Oversight**
- View all library activities in real-time

---

## 🗄️ Database Tables

### library_books
- Stores all books in inventory
- Fields: code, title, author, quantity, location, unit_cost, supplier, received_date, notes

### book_borrowing
- Tracks student book borrowing
- Fields: ref, book_title, book_code, student_admission, student_class, status, date_borrowed, date_returned, approver, notes

### exercise_book_exchanges
- Records exercise book exchanges
- Fields: ref, student_name, student_class, book_type, quantity, notes

---

## 🔌 API Endpoints

### Books Management
- `GET /api/books` - List all books
- `POST /api/books` - Add new book
- `PATCH /api/books/:id` - Update book details

### Book Borrowing
- `POST /api/borrowing` - Record borrowing
- `GET /api/borrowing` - List borrowing records
- `GET /api/borrowing?status=borrowed` - Get unreturned books
- `PATCH /api/borrowing/:id/approve-return` - Approve return

### Exercise Exchanges
- `POST /api/exercise-exchanges` - Record exchange
- `GET /api/exercise-exchanges` - List exchanges

### Book Requisitions
- `POST /api/requisitions` - Create requisition (with category='library')
- `GET /api/requisitions?role=librarian` - Get librarian requisitions
- `PATCH /api/requisitions/:id` - Approve/reject requisition

### Stats
- `GET /api/stats?role=librarian` - Library statistics

---

## 🖥️ User Interface

### Navigation
Library appears in the sidebar for both Librarian and Admin roles

### Library Dashboard (5 Tabs)
1. **Book Borrowing** - View all borrowing records with search
2. **Unreturned Books** - Approve book returns
3. **Book Inventory** - View books with search/filter
4. **Exercise Books** - Track exchanges
5. **Requisitions** - Manage book requests

### Forms Available
- Record Book Borrowing (+ button)
- Add Book to Inventory (+ button)
- Record Exercise Exchange (+ button)
- Request Books/Requisition (+ button)

---

## 🔍 Verification Checklist

Before using the system, verify:

- [ ] Node.js is installed (`node --version`)
- [ ] npm is working (`npm --version`)
- [ ] Database file exists: `database.db`
- [ ] Dependencies installed: `node_modules/` folder exists
- [ ] Port 3000 is available

---

## 📝 Testing the System

### Test Librarian Workflow
1. Login as librarian (librarian/lib123)
2. Go to Library section
3. Click "+ Add Book" and add a test book
4. Click "+ Record Borrowing" and record a test borrowing
5. Go to "Unreturned Books" tab
6. Click "Approve Return" button
7. Check updated stats on dashboard

### Test Admin Workflow
1. Login as admin (admin/admin123)
2. Check dashboard stats - should show library metrics
3. Go to Requisitions
4. See any pending book requisitions from librarian
5. Approve or reject requests

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Issues
```bash
# Database will auto-initialize on first run
# If issues persist, delete database.db and restart
rm database.db
npm start
```

### Missing Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 📞 Support Information

**System:** Dawamu School Management System v2.0  
**New Feature:** Library Management System  
**Status:** Fully Integrated & Tested  
**Ready:** ✅ Yes

For issues, check the console output when running `npm start`.

---

**Last Updated:** May 17, 2026  
**Implementation Status:** Complete (11/11 tasks done)
