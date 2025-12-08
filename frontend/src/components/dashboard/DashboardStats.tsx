import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { DashboardStats as DashboardStatsType } from '../../types/dashboard';

// Remove KPI from Props if not needed
interface Props {
  stats: DashboardStatsType;
  // REMOVE kpis: KPI[]; // This line if it exists
}

const DashboardStats: React.FC<Props> = ({ stats }) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Equipment
            </Typography>
            <Typography variant="h4" component="div">
              {stats.totalEquipment || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Processed Drawings
            </Typography>
            <Typography variant="h4" component="div">
              {stats.processedDrawings || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Pending Inspections
            </Typography>
            <Typography variant="h4" component="div">
              {stats.pendingInspections || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Completed Inspections
            </Typography>
            <Typography variant="h4" component="div">
              {stats.completedInspections || 0}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Data Accuracy
            </Typography>
            <Typography variant="h4">
              {stats.dataAccuracy ? `${stats.dataAccuracy}%` : "N/A"}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardStats;