import { useEffect, useState } from "react";
import { Paper, Typography, TextField, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Edit } from "@mui/icons-material";

import {
 getExpenses,
 addExpense,
 updateExpense
} from "../../api/financeApi";
import { formatDate } from "../../utils/date";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const DailyExpense = () => {

 const [rows, setRows] = useState([]);
 const [openDialog, setOpenDialog] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [editForm, setEditForm] = useState({
   expense_date: "",
   description: "",
   amount: ""
 });

const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

const [form, setForm] = useState({
  expense_date: today,
  description: "",
  amount: ""
});

const loadExpenses = async () => {

  try {

    const res = await getExpenses();

    if (Array.isArray(res.data)) {
      setRows(res.data);
    } else {
      console.error("Unexpected API response:", res.data);
      setRows([]);
    }

  } catch (error) {
    console.error("Expense fetch error:", error);
    setRows([]);
  }

};

 useEffect(() => {
   loadExpenses();
 }, []);

 const handleChange = (e) => {
   setForm({ ...form, [e.target.name]: e.target.value });
 };

 const handleAdd = async () => {

   await addExpense({
 ...form,
 amount: Number(form.amount)
});

   setForm({
  expense_date: today,
  description: "",
  amount: ""
});

   loadExpenses();
 };

 const handleEdit = (row) => {
   setEditingId(row.id);
   setEditForm({
     expense_date: row.expense_date,
     description: row.description,
     amount: row.amount
   });
   setOpenDialog(true);
 };

 const handleEditChange = (e) => {
   setEditForm({ ...editForm, [e.target.name]: e.target.value });
 };

 const handleEditSave = async () => {
   await updateExpense(editingId, {
     ...editForm,
     amount: Number(editForm.amount)
   });
   setOpenDialog(false);
   setEditingId(null);
   setEditForm({ expense_date: "", description: "", amount: "" });
   loadExpenses();
 };

 const handleEditCancel = () => {
   setOpenDialog(false);
   setEditingId(null);
   setEditForm({ expense_date: "", description: "", amount: "" });
 };

 const columns = [

   { 
     field: "expense_date", 
     headerName: "Date", 
     width: 150,
     renderCell: (params) => {
       return formatDate(params.row.expense_date);
     }
   },

   { field: "description", headerName: "Description", width: 300 },

   { field: "amount", headerName: "Amount", width: 150 },

   {
     field: "action",
     headerName: "Action",
     width: 120,
     renderCell: (params) => (
       <Button
         variant="contained"
         color="primary"
         size="small"
         startIcon={<Edit />}
         onClick={() => handleEdit(params.row)}
       >
         Edit
       </Button>
     )
   }

 ];

 return (
   <Paper sx={{ p: 3 }}>

     <Typography variant="h5" sx={{ mb: 3 }}>
       Daily Expenses
     </Typography>

     <Grid container spacing={2} sx={{ mb: 3 }}>

<Grid size={3}>
<TextField
 type="date"
 label="Date"
 name="expense_date"
 value={form.expense_date}
 onChange={handleChange}
 fullWidth
 InputLabelProps={{ shrink: true }}
/>
</Grid>

<Grid size={5}>
<TextField
 label="Description"
 name="description"
 value={form.description}
 onChange={handleChange}
 fullWidth
/>
</Grid>

<Grid size={2}>
<TextField
 label="Amount"
 name="amount"
 value={form.amount}
 onChange={handleChange}
 fullWidth
/>
</Grid>

<Grid size={2}>
<Button
 variant="contained"
 fullWidth
 onClick={handleAdd}
>
 Add Expense
</Button>
</Grid>

</Grid>

     <div style={{ height: 400 }}>
<DataGrid
 rows={rows || []}
 columns={columns}
 getRowId={(row) => row.id}
 initialState={{
   pagination: { paginationModel: { pageSize: 5 } }
 }}
 pageSizeOptions={[5,10]}
/>
</div>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={handleEditCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            type="date"
            label="Date"
            name="expense_date"
            value={editForm.expense_date}
            onChange={handleEditChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            name="description"
            value={editForm.description}
            onChange={handleEditChange}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Amount"
            name="amount"
            type="number"
            value={editForm.amount}
            onChange={handleEditChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
     

   </Paper>
 );

};

export default DailyExpense;