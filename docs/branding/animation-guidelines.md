# NXTQR Animated Logo Guidelines

The reveal follows the channel from the lower-left terminal toward the upper-right terminal.

| Mode          | Trigger                                                 | Motion                                                                           |
| :------------ | :------------------------------------------------------ | :------------------------------------------------------------------------------- |
| `entrance`    | First render or Replay in the Brand Review Gate         | A diagonal wipe reveals the mark over 620 ms.                                    |
| `interactive` | Hover or keyboard focus on the containing link          | The mark shifts slightly up and right over 160 ms.                               |
| `loading`     | Active loading or Test Loading in the Brand Review Gate | The mark reveals, holds, and fades to its muted silhouette in a 1.6-second loop. |

Motion runs inside `prefers-reduced-motion: no-preference`. With reduced motion enabled, the complete mark appears immediately.
