import { Card, CardContent, Typography, Box } from "@mui/material";

const KpiCard = ({ title, value }) => {
  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>

        <Box mt={2}>
          <Typography variant="h5" fontWeight="bold">
            ₹ {value?.toLocaleString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default KpiCard;