# NXTQR Animated Logo Guidelines

The aperture moves up and right along the direction of the channel while the corner brackets hold their position.

| Mode          | Trigger                                                 | Motion                                                            |
| :------------ | :------------------------------------------------------ | :---------------------------------------------------------------- |
| `entrance`    | First render or Replay in the Brand Review Gate         | The mark slides into place and fades to full opacity over 420 ms. |
| `interactive` | Hover or keyboard focus on the containing link          | The mark shifts slightly up and right over 160 ms.                |
| `loading`     | Active loading or Test Loading in the Brand Review Gate | The mark alternates between its two positions every 700 ms.       |

Motion runs inside `prefers-reduced-motion: no-preference`. With reduced motion enabled, the complete mark appears immediately.
