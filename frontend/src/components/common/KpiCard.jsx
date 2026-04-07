import { Card, CardContent, Typography, Box } from "@mui/material";

const KpiCard = ({ title, value, subtitle, sx }) => {
  return (
    <Card elevation={3} sx={sx}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" sx={sx?.["& h6"] ? { color: "inherit" } : {}}>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="caption" sx={{ opacity: 0.8, display: "block", mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}

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