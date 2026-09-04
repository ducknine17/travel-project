import { render, screen } from '@testing-library/react';
import App from './App';
import api from "./services/api";

jest.mock("react-router-dom", () => {
  const React = require("react");

  return {
    BrowserRouter: ({ children }) => React.createElement("div", null, children),
    Link: ({ to, children }) => React.createElement("a", { href: to }, children),
    Route: () => null,
    Routes: ({ children }) => {
      const route = React.Children.toArray(children).find(
        (child) => child.props.path === "/"
      );
      return route?.props.element || null;
    },
    useLocation: () => ({ pathname: "/" }),
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
  };
});

jest.mock("./services/api", () => ({
  get: jest.fn(),
}));

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('renders browse page', async () => {
  api.get.mockResolvedValue({ data: [] });

  render(<App />);

  expect(await screen.findByRole("heading", { name: "둘러보기" })).toBeInTheDocument();
});
