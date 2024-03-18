import { useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import './Home.css';
import useAxiosPrivate from '../hooks/useAxiosPrivate';
import type { FormType, PaginatedResponseType } from '../types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import axios from '@/lib/axios';
interface FormsResponseType extends PaginatedResponseType {
  forms: FormType[];
  totalResponsesByForm: {
    formId: string;
    formName: string;
    totalResponses: number;
  }[];
}

function Home() {
  const [searchParams] = useSearchParams();
  const axiosPrivate = useAxiosPrivate();

  const params = {
    page: searchParams.get('page') || 0,
    pageSize: searchParams.get('pageSize') || 10,
    sort: searchParams.get('sort') || '-createdAt',
    search: searchParams.get('query'),
  };
  const { data } = useQuery<FormsResponseType>({
    queryKey: ['forms', params],
    queryFn: () =>
      axiosPrivate({
        url: '/forms',
        params,
      }).then(res => res.data.data),
    placeholderData: keepPreviousData,
  });
  let totalActiveForms = 0;
  let totalinActiveForms = 0;
  if (data) {
    totalActiveForms = data.forms.filter(form => form.isActive).length;
    totalinActiveForms = data.forms.filter(form => !form.isActive).length;
  }

  const [lineChart, setLineChart] = useState<Chart | null>(null);
  const [doughnutChart, setDoughnutChart] = useState<Chart | null>(null);

  const [totalResponses, setTotalResponses] = useState<
    FormsResponseType['totalResponsesByForm']
  >([]);
  const userId = localStorage.getItem('userId');
  if (!userId) {
    console.error('User ID not found in local storage');
    return;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchTotalResponsesByForm = async () => {
      try {
        const response = await axios.get(`/forms/${userId}/getallresponse`);
        setTotalResponses(response.data.data.totalResponsesByForm);
      } catch (error) {
        console.error('Error fetching total responses by form:', error);
      }
    };

    fetchTotalResponsesByForm();
  }, [userId]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!totalResponses.length) return;

    // Extract form names and total responses from the response data
    const labels = totalResponses.map(item => item.formName);
    const totalResponsesData = totalResponses.map(item => item.totalResponses);
    console.log(labels);

    // Chart 1
    const lineChartElement = document.getElementById(
      'lineChart',
    ) as HTMLCanvasElement | null;
    if (lineChartElement) {
      if (lineChart) {
        lineChart.destroy();
      }
      const ctx = lineChartElement.getContext('2d');
      if (ctx) {
        const newLineChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Total Responses',
                data: totalResponsesData,
                backgroundColor: 'rgba(85, 85, 85, 1)',
                borderColor: 'rgb(41, 155, 99)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1, // Display integer values only
                },
              },
            },
          },
        });
        setLineChart(newLineChart);
      }
    }
  }, [totalResponses]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!data) return;

    // Function to create the doughnut chart
    const createDoughnutChart = () => {
      const doughnutChartElement = document.getElementById(
        'doughnut',
      ) as HTMLCanvasElement | null;
      if (doughnutChartElement) {
        const ctx = doughnutChartElement.getContext('2d');
        if (ctx) {
          const totalActiveForms = data.forms.filter(
            form => form.isActive,
          ).length;
          const totalInactiveForms = data.forms.filter(
            form => !form.isActive,
          ).length;

          const newDoughnutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Active', 'Inactive'],
              datasets: [
                {
                  label: 'Forms',
                  data: [totalActiveForms, totalInactiveForms],
                  backgroundColor: [
                    'rgba(41, 155, 99, 1)',
                    'rgba(54, 162, 235, 1)',
                  ],
                  borderColor: [
                    'rgba(41, 155, 99, 1)',
                    'rgba(54, 162, 235, 1)',
                  ],
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
            },
          });

          return newDoughnutChart;
        }
      }
      return null;
    };

    // Clean up previous chart instance before creating a new one
    if (doughnutChart) {
      doughnutChart.destroy();
    }

    // Create a new chart instance
    const newDoughnutChart = createDoughnutChart();
    setDoughnutChart(newDoughnutChart);

    // Clean up on component unmount
    return () => {
      if (newDoughnutChart) {
        newDoughnutChart.destroy();
      }
    };
  }, [data]); // Depend on data to re-run the effect when data changes
  // Only run the effect when 'data' changes

  // Explicitly include doughnutChart in the dependency array

  return (
    <div className="container">
      <div className="cards">
        <div className="card">
          <div className="card-content">
            <div className="number">{totalActiveForms}</div>
            <div className="card-name">Active Forms</div>
          </div>
          <div className="icon-box">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="number">{totalinActiveForms}</div>
            <div className="card-name">Inactive Forms</div>
          </div>
          <div className="icon-box">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="number">{data?.total}</div>
            <div className="card-name">Total Forms</div>
          </div>
          <div className="icon-box">
            <i className="fas fa-users"></i>
          </div>
        </div>
        <div className="card">
          <div className="card-content">
            <div className="number">{totalResponses.length}</div>
            <div className="card-name">Total Responses</div>
          </div>
          <div className="icon-box">
            <i className="fas fa-users"></i>
          </div>
        </div>
      </div>
      <div className="charts">
        <div className="chart">
          <h2>Form Responses</h2>
          <div>
            <canvas id="lineChart"></canvas>
          </div>
        </div>
        <div className="chart doughnut-chart">
          <h2>Forms</h2>
          <div>
            <canvas id="doughnut"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
