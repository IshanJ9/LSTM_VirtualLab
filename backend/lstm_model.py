"""
Custom LSTM implementation using PyTorch.
Explicitly computes all 4 gates for full interpretability.
"""
import torch
import torch.nn as nn
import numpy as np


class CustomLSTMCell(nn.Module):
    """Single LSTM cell with explicit gate computation."""

    def __init__(self, input_size: int, hidden_size: int):
        super().__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        combined = input_size + hidden_size
        self.W_f = nn.Linear(combined, hidden_size)   # Forget gate
        self.W_i = nn.Linear(combined, hidden_size)   # Input gate
        self.W_o = nn.Linear(combined, hidden_size)   # Output gate
        self.W_g = nn.Linear(combined, hidden_size)   # Candidate cell state

    def forward(self, x_t, h_prev, c_prev):
        combined = torch.cat([x_t, h_prev], dim=-1)
        f_t = torch.sigmoid(self.W_f(combined))   # Forget gate
        i_t = torch.sigmoid(self.W_i(combined))   # Input gate
        o_t = torch.sigmoid(self.W_o(combined))   # Output gate
        g_t = torch.tanh(self.W_g(combined))       # Candidate cell state
        c_t = f_t * c_prev + i_t * g_t            # New cell state
        h_t = o_t * torch.tanh(c_t)               # New hidden state
        return h_t, c_t, f_t, i_t, o_t, g_t


class CustomLSTM(nn.Module):
    """Full LSTM sequence model built atop the custom cell."""

    def __init__(self, input_size: int = 1, hidden_size: int = 16, output_size: int = 1):
        super().__init__()
        self.hidden_size = hidden_size
        self.cell = CustomLSTMCell(input_size, hidden_size)
        self.output_layer = nn.Linear(hidden_size, output_size)

    def forward(self, x_seq):
        """x_seq: (seq_len, batch, input_size)"""
        seq_len, batch_size, _ = x_seq.shape
        h = torch.zeros(batch_size, self.hidden_size)
        c = torch.zeros(batch_size, self.hidden_size)
        outputs, gate_info = [], []
        for t in range(seq_len):
            h, c, f, i, o, g = self.cell(x_seq[t], h, c)
            pred = self.output_layer(h)
            outputs.append(pred)
            gate_info.append({
                "forget_gate": f.detach().cpu().numpy().tolist(),
                "input_gate":  i.detach().cpu().numpy().tolist(),
                "output_gate": o.detach().cpu().numpy().tolist(),
                "candidate":   g.detach().cpu().numpy().tolist(),
                "cell_state":  c.detach().cpu().numpy().tolist(),
                "hidden_state": h.detach().cpu().numpy().tolist(),
            })
        return torch.stack(outputs), gate_info

    def run_inference(self, x_seq: np.ndarray, y_seq: np.ndarray,
                      extra_fields: dict = None) -> list:
        """Run inference and return per-timestep dicts for the API."""
        self.eval()
        with torch.no_grad():
            x_tensor = torch.FloatTensor(x_seq).view(-1, 1, 1)
            preds, gate_info = self.forward(x_tensor)
        results = []
        for t in range(len(x_seq)):
            g = gate_info[t]
            row = {
                "t": t,
                "input":        round(float(x_seq[t]), 5),
                "actual":       round(float(y_seq[t]), 5),
                "predicted":    round(float(preds[t].item()), 5),
                "forget_gate":  round(float(np.mean(g["forget_gate"])), 5),
                "input_gate":   round(float(np.mean(g["input_gate"])), 5),
                "output_gate":  round(float(np.mean(g["output_gate"])), 5),
                "candidate":    round(float(np.mean(g["candidate"])), 5),
                "cell_state":   [round(v, 4) for v in g["cell_state"][0][:8]],
                "hidden_state": [round(v, 4) for v in g["hidden_state"][0][:8]],
            }
            if extra_fields:
                for k, v in extra_fields.items():
                    if isinstance(v, list) and t < len(v):
                        row[k] = v[t]
            results.append(row)
        return results


def train_model(model: CustomLSTM, x_seq: np.ndarray, y_seq: np.ndarray,
                epochs: int = 400, lr: float = 0.01) -> list:
    """Train model on a sequence dataset, return loss history."""
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()
    x_tensor = torch.FloatTensor(x_seq).view(-1, 1, 1)
    y_tensor = torch.FloatTensor(y_seq).view(-1, 1, 1)
    losses = []
    for _ in range(epochs):
        model.train()
        optimizer.zero_grad()
        preds, _ = model(x_tensor)
        loss = criterion(preds, y_tensor)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        losses.append(float(loss.item()))
    return losses
