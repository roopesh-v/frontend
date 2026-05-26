# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)


## AI prompts

``` 
1. Create a reusable navbar React component with links:
- Employees
- Dashboard

Use clean modern styling with plain CSS.

2. Create a React Employees page.

Requirements:
- fetch employees from GET /employees using axios
- use useEffect and useState
- display employees in table
- columns:
  full name
  email
  country
  job title
  salary
- add loading state
- clean modern styling

3. Create a reusable EmployeeForm React component.

Requirements:
- controlled inputs
- fields:
  first_name
  last_name
  email
  country
  job_title
  department
  salary
- submit to Rails API using axios
- use POST /employees
- show validation errors
- reset form after success
- modern clean UI

4. After employee creation, refresh employee list automatically using callback props.

5. Add delete employee functionality.

Requirements:
- add delete button in each row
- call DELETE /employees/:id
- confirm before delete
- refresh table after deletion


```

