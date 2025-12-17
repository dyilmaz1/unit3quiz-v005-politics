import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Papa from 'papaparse'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

export function Dashboard() {
  const [rawData, setRawData] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [availableMonths, setAvailableMonths] = useState([])
  const [selectedMonth, setSelectedMonth] = useState('all')
  const { currentUser, logout } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load from assets folder - file is in public/assets/ which gets copied to dist/assets/
      const filePath = '/assets/Warehouse_and_Retail_Sales.csv'
      
      console.log('Loading CSV file from:', filePath)
      const response = await fetch(filePath)
      
      if (!response.ok) {
        throw new Error(`Failed to load data file from ${filePath}. Status: ${response.status} ${response.statusText}`)
      }

      // Get the response as text
      const fileContent = await response.text()
      
      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error('The file is empty or could not be read.')
      }
      
      // Check if it's actually CSV text or if it's a PDF
      if (fileContent.startsWith('%PDF')) {
        throw new Error('The file appears to be a PDF. Please ensure you have a CSV file.')
      }
      
      console.log('File loaded successfully, length:', fileContent.length)
      // Parse the CSV data
      processCSVData(fileContent)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const extractMonthFromDate = (dateString, monthNumber) => {
    // If we have a numeric month (1-12), convert it to month name
    if (monthNumber) {
      const monthNum = parseInt(monthNumber)
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December']
        return monthNames[monthNum - 1]
      }
    }
    
    if (!dateString) return null
    
    try {
      // Try to parse various date formats
      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      }
    } catch (e) {
      // If date parsing fails, try to extract month name directly
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December']
      const monthMatch = dateString.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i)
      if (monthMatch) {
        return monthMatch[0].charAt(0).toUpperCase() + monthMatch[0].slice(1).toLowerCase()
      }
    }
    return null
  }

  const processCSVData = (csvText) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError('CSV file is empty or has no data rows.')
          setLoading(false)
          return
        }
        
        const parsedData = results.data.filter(row => {
          // Filter out completely empty rows
          return Object.values(row).some(val => val && val.toString().trim() !== '')
        })
        
        if (parsedData.length === 0) {
          setError('No valid data found in CSV file.')
          setLoading(false)
          return
        }
        
        // Log first row to help debug column names
        console.log('CSV columns:', Object.keys(parsedData[0]))
        console.log('First row sample:', parsedData[0])
        
        // Find date/month column - the CSV has MONTH column with numeric values
        const monthColumn = Object.keys(parsedData[0] || {}).find(key => 
          /^month$/i.test(key.trim())
        )
        const dateColumn = Object.keys(parsedData[0] || {}).find(key => 
          /date|time|order.*date/i.test(key)
        )
        
        // Extract unique months
        const monthsSet = new Set()
        parsedData.forEach(row => {
          // Try numeric month first (from MONTH column), then date parsing
          const month = extractMonthFromDate(
            row[dateColumn] || row['Date'] || row['Order Date'],
            row[monthColumn] || row['MONTH'] || row['Month']
          )
          if (month) {
            monthsSet.add(month)
          }
        })
        
        const months = Array.from(monthsSet).sort((a, b) => {
          const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December']
          return monthOrder.indexOf(a) - monthOrder.indexOf(b)
        })
        
        setAvailableMonths(months)
        setRawData(parsedData)
        
        // Process data for all months initially
        processDataByMonth(parsedData, 'all')
        setLoading(false)
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        setError('Error parsing CSV: ' + error.message + '. Please check the file format.')
        setLoading(false)
      }
    })
  }

  const processDataByMonth = (parsedData, monthFilter) => {
    // Find date/month column - the CSV has MONTH column with numeric values
    const monthColumn = Object.keys(parsedData[0] || {}).find(key => 
      /^month$/i.test(key.trim())
    )
    const dateColumn = Object.keys(parsedData[0] || {}).find(key => 
      /date|time|order.*date/i.test(key)
    )
    
    // Group by Item Type and sum Warehouse Sales, filtered by month
    const groupedData = {}
    
    parsedData.forEach(row => {
      // Extract month from numeric MONTH column or date
      const rowMonth = extractMonthFromDate(
        row[dateColumn] || row['Date'] || row['Order Date'],
        row[monthColumn] || row['MONTH'] || row['Month']
      )
      
      // Filter by month if not 'all'
      if (monthFilter !== 'all' && rowMonth !== monthFilter) {
        return
      }
      
      // Use exact column names from CSV: ITEM TYPE and WAREHOUSE SALES
      const itemType = row['ITEM TYPE'] || row['Item Type'] || row['ItemType'] || row['item_type'] || 
                       row['Item_Type'] || row['Item'] || row['Type'] || row['Product Type'] || row['Category']
      
      const warehouseSales = parseFloat(
        row['WAREHOUSE SALES'] || row['Warehouse Sales'] || row['WarehouseSales'] || 
        row['warehouse_sales'] || row['Warehouse_Sales'] || row['Warehouse Sale'] || 
        row['Sales'] || row['Total Sales'] || row['Amount'] || 0
      )
      
      if (itemType && !isNaN(warehouseSales)) {
        if (!groupedData[itemType]) {
          groupedData[itemType] = 0
        }
        groupedData[itemType] += warehouseSales
      }
    })
    
    // Convert to array format for chart
    const chartData = Object.entries(groupedData).map(([itemType, totalSales]) => ({
      itemType,
      totalSales: Math.round(totalSales * 100) / 100
    }))
    
    // Sort by total sales descending
    chartData.sort((a, b) => b.totalSales - a.totalSales)
    
    setData(chartData)
  }

  const handleMonthChange = (month) => {
    setSelectedMonth(month)
    processDataByMonth(rawData, month)
  }

  return (
    <div className="article-container">
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {currentUser?.email}</h2>
        </div>
        <div className="header-actions">
          <a href="#voter-registration" className="nav-button">
            Voter Registration
          </a>
          <button onClick={logout} className="logout-button">
            Sign Out
          </button>
        </div>
      </div>

      <article className="statistical-article">
        <header className="article-header">
          <h1 className="article-title">Warehouse Sales Analysis: A Comprehensive Statistical Review</h1>
          <div className="article-meta">
            <span className="author">Statistical Analysis Team</span>
            <span className="date">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        <section className="article-content">
          <div className="abstract">
            <h2>Abstract</h2>
            <p>
              This statistical analysis examines warehouse sales data across different item types, 
              providing insights into sales distribution and performance metrics. The analysis 
              aggregates total warehouse sales by item type to identify trends and patterns in 
              the distribution network.
            </p>
          </div>

          <div className="methodology">
            <h2>Methodology</h2>
            <p>
              Data was collected from warehouse sales records and aggregated by item type. 
              Total sales figures were calculated for each category to provide a comprehensive 
              overview of warehouse performance. The visualization below presents the aggregated 
              data in a bar chart format, with item types on the x-axis and total warehouse 
              sales on the y-axis.
            </p>
          </div>

          <div className="data-visualization">
            <h2>Data Visualization</h2>
            {loading && (
              <div className="loading-message">
                <p>Loading data...</p>
              </div>
            )}
            
            {error && (
              <div className="error-message">
                <p><strong>Error loading data:</strong> {error}</p>
                <p>Please ensure the CSV file is located in the assets folder.</p>
              </div>
            )}

            {!loading && !error && data.length > 0 && (
              <>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart
                      data={data}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 100,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="itemType" 
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        interval={0}
                      />
                      <YAxis 
                        label={{ value: 'Total Warehouse Sales', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value) => `$${value.toLocaleString()}`}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="totalSales" 
                        fill="#4A90E2" 
                        name="Total Warehouse Sales"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {availableMonths.length > 0 && (
                    <div className="month-switcher">
                      <div className="month-switcher-label">Filter by Month:</div>
                      <div className="month-buttons">
                        <button
                          className={`month-button ${selectedMonth === 'all' ? 'active' : ''}`}
                          onClick={() => handleMonthChange('all')}
                        >
                          All Months
                        </button>
                        {availableMonths.map((month) => (
                          <button
                            key={month}
                            className={`month-button ${selectedMonth === month ? 'active' : ''}`}
                            onClick={() => handleMonthChange(month)}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="statistics-summary">
                  <h3>Summary Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Total Item Types:</span>
                      <span className="stat-value">{data.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Sales:</span>
                      <span className="stat-value">
                        ${data.reduce((sum, item) => sum + item.totalSales, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Average Sales per Type:</span>
                      <span className="stat-value">
                        ${(data.reduce((sum, item) => sum + item.totalSales, 0) / data.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Highest Sales:</span>
                      <span className="stat-value">
                        {data[0]?.itemType} (${data[0]?.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="conclusion">
            <h2>Conclusion</h2>
            <p>
              The analysis reveals significant variations in warehouse sales across different 
              item types. Understanding these patterns is crucial for inventory management, 
              supply chain optimization, and strategic planning. Further analysis may include 
              temporal trends, regional variations, and correlation with retail sales data.
            </p>
          </div>
        </section>

        <footer className="article-footer">
          <p className="footer-note">
            Data source: Warehouse and Retail Sales Dataset | Analysis generated on {new Date().toLocaleDateString()}
          </p>
          <div className="footer-links">
            <a 
              href="https://catalog.data.gov/dataset/warehouse-and-retail-sales" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              Data Source: Warehouse and Retail Sales Dataset
            </a>
            <span className="footer-separator">|</span>
            <a 
              href="https://github.com/dyilmaz1/unit3quiz-v005-politics" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              View Source Code on GitHub
            </a>
          </div>
        </footer>
      </article>
    </div>
  )
}

