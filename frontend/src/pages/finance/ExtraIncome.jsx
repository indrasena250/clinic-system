import { useEffect, useState } from "react";
import { Paper, Typography, Grid, TextField, Button, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent, Stack, useTheme, useMediaQuery } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import { getIncome, addIncome, updateIncome } from "../../api/incomeApi";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const ExtraIncome = () => {
 const theme = useTheme();
 const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

 const [rows, setRows] = useState([]);
 const [editDialogOpen, setEditDialogOpen] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [editForm, setEditForm] = useState({
  income_date: "",
  income_type: "Other",
  description: "",
  amount: ""
 });
 
 const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

 const [form, setForm] = useState({
  income_date: today,
  income_type: "Other",
  description: "",
  amount: ""
 });

 const loadIncome = async () => {
  const res = await getIncome();
  setRows(res.data);
 };

 useEffect(() => {
  loadIncome();
 }, []);

 const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "income_type") {
    setForm({
      ...form,
      income_type: value,
      description: "",
      amount: ""
    });
    return;
  }

  setForm({ ...form, [name]: value });
 };

 const handleEditChange = (e) => {
  const { name, value } = e.target;
  setEditForm({ ...editForm, [name]: value });
 };

const handleAdd = async () => {

  if (!form.income_type) {
    alert("Please select income type");
    return;
  }

  if (!form.amount) {
    alert("Please enter amount");
    return;
  }

  await addIncome(form);

  setForm({
    income_date: today,
    income_type: "Other",
    description: "",
    amount: ""
  });

  loadIncome();
};

const handleEdit = (row) => {
  setEditingId(row.id);
  setEditForm({
    income_date: row.income_date,
    income_type: row.income_type,
    description: row.description,
    amount: row.amount
  });
  setEditDialogOpen(true);
};

const handleEditSave = async () => {
  if (!editForm.income_type) {
    alert("Please select income type");
    return;
  }

  if (!editForm.amount) {
    alert("Please enter amount");
    return;
  }

  await updateIncome(editingId, editForm);
  setEditDialogOpen(false);
  setEditingId(null);
  loadIncome();
};

const handleEditClose = () => {
  setEditDialogOpen(false);
  setEditingId(null);
};

 const columns = [

  {
  field: "income_date",
  headerName: "Date",
  width: 150,
  renderCell: (params) => {
    if (!params.row.income_date) return "";

    const date = params.row.income_date.split("T")[0]; 
    const [year, month, day] = date.split("-");

    return `${day}-${month}-${year}`;
  }
},

  { field: "income_type", headerName: "Type", width: 120 },

  { field: "description", headerName: "Description", width: 300 },

  { field: "amount", headerName: "Amount", width: 150 },

  {
   field: "action",
   headerName: "Action",
   width: 120,
   renderCell: (params) => (
    <Button color="primary" onClick={() => handleEdit(params.row)}>
     Edit
    </Button>
   )
  }

 ];

 return (
  <Paper sx={{ p: 3 }}>

   <Typography variant="h5" sx={{ mb: 3 }}>
    Extra Income
   </Typography>

   <Grid container spacing={2} sx={{ mb: 3 }}>

    <Grid item xs={12} sm={2}>
     <TextField
      type="date"
      label="Date"
      name="income_date"
      value={form.income_date}
      onChange={handleChange}
      fullWidth
      InputLabelProps={{ shrink: true }}
      size={isMobile ? "small" : "medium"}
     />
    </Grid>

    <Grid item xs={12} sm={2}>
      <TextField
        select
        label="Income Type"
        name="income_type"
        value={form.income_type}
        onChange={handleChange}
        fullWidth
        size={isMobile ? "small" : "medium"}
      >
        <MenuItem value="USG">USG</MenuItem>
        <MenuItem value="CT">CT</MenuItem>
        <MenuItem value="XRAY">XRAY</MenuItem>
        <MenuItem value="Other">Other</MenuItem>
      </TextField>
    </Grid>

    <Grid item xs={12} sm={4}>
      <TextField
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        fullWidth
        size={isMobile ? "small" : "medium"}
      />
    </Grid>

    <Grid item xs={12} sm={2}>
     <TextField
      type="number"
      label="Amount"
      name="amount"
      value={form.amount}
      onChange={handleChange}
      fullWidth
      size={isMobile ? "small" : "medium"}
      />
    </Grid>

    <Grid item xs={12} sm={2}>
     <Button
      variant="contained"
      fullWidth
      onClick={handleAdd}
      size={isMobile ? "medium" : "large"}
     >
      Add
     </Button>
    </Grid>

   </Grid>

   {isMobile ? (
     <Stack spacing={2}>
       {rows.map((row) => (
         <Card
           key={row.id}
           sx={{
             borderRadius: 2,
             boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
             p: 1,
             border: "1px solid rgba(0,0,0,0.08)",
             background: "linear-gradient(135deg, #fff 0%, #f7f8ff 100%)"
           }}
         >
           <CardContent>
             <Typography sx={{ fontWeight: 700 }}>{row.income_type}</Typography>
             <Typography sx={{ fontSize: 14, color: "#414752" }}>{row.description}</Typography>
             <Typography sx={{ fontSize: 14 }}><strong>Date:</strong> {row.income_date}</Typography>
             <Typography sx={{ fontSize: 14, mt: 0.5 }}><strong>Amount:</strong> ₹{row.amount}</Typography>
             <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => handleEdit(row)}>Edit</Button>
           </CardContent>
         </Card>
       ))}
     </Stack>
   ) : (
     <div style={{ height: 400 }}>
      <DataGrid
       rows={rows}
       columns={columns}
       pageSize={5}
      />
     </div>
   )}

   {/* Edit Modal */}
   <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
    <DialogTitle>Edit Income</DialogTitle>
    <DialogContent sx={{ mt: 2 }}>
     <Grid container spacing={2}>
      <Grid item xs={12}>
       <TextField
        type="date"
        label="Date"
        name="income_date"
        value={editForm.income_date}
        onChange={handleEditChange}
        fullWidth
        InputLabelProps={{ shrink: true }}
       />
      </Grid>

      <Grid item xs={12}>
       <TextField
         select
         label="Income Type"
         name="income_type"
         value={editForm.income_type}
         onChange={handleEditChange}
         fullWidth
       >
         <MenuItem value="USG">USG</MenuItem>
         <MenuItem value="CT">CT</MenuItem>
         <MenuItem value="XRAY">XRAY</MenuItem>
         <MenuItem value="Other">Other</MenuItem>
       </TextField>
      </Grid>

      <Grid item xs={12}>
       <TextField
         label="Description"
         name="description"
         value={editForm.description}
         onChange={handleEditChange}
         fullWidth
       />
      </Grid>

      <Grid item xs={12}>
       <TextField
         type="number"
         label="Amount"
         name="amount"
         value={editForm.amount}
         onChange={handleEditChange}
         fullWidth
       />
      </Grid>
     </Grid>
    </DialogContent>
    <DialogActions>
     <Button onClick={handleEditClose}>Cancel</Button>
     <Button variant="contained" onClick={handleEditSave}>Update</Button>
    </DialogActions>
   </Dialog>

  </Paper>
 );
};

export default ExtraIncome;