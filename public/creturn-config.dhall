-- Type definitions
let Service = { name : Text, selectors : List Text }

let Services = List { mapKey : Text, mapValue : Service }

-- Configuration
let config =
      { updated = "2025-05-31"
      , license = "MIT ©︎ 2025 cojiso"
      , contact = "creturn_support@googlegroups.com"
      , services =
          [ { mapKey = "*.openai.com"
            , mapValue = { name = "ChatGPT", selectors = [ "#prompt-textarea" ] }
            }
          , { mapKey = "chatgpt.com"
            , mapValue = { name = "ChatGPT", selectors = [ "#prompt-textarea" ] }
            }
          , { mapKey = "claude.ai"
            , mapValue =
              { name = "Claude"
              , selectors = [ "div[contenteditable='true']", "textarea" ]
              }
            }
          , { mapKey = "gemini.google.com"
            , mapValue =
              { name = "Google Gemini"
              , selectors =
                [ "div.ql-editor[contenteditable='true']"
                , "div.mat-mdc-form-field-infix"
                ]
              }
            }
          , { mapKey = "www.perplexity.ai"
            , mapValue = { name = "Perplexity AI", selectors = [ "textarea" ] }
            }
          , { mapKey = "notebooklm.google.com"
            , mapValue =
              { name = "NotebookLM", selectors = [ "textarea.query-box-input" ] }
            }
          , { mapKey = "github.com"
            , mapValue =
              { name = "GitHub Copilot"
              , selectors =
                [ "textarea[placeholder='Ask Copilot']", "#copilot-chat-textarea" ]
              }
            }
          , { mapKey = "v0.app"
            , mapValue =
              { name = "v0.app"
              , selectors = [ "#prompt-textarea-_new-chat_", "div[role='textbox']" ]
              }
            }
          , { mapKey = "felo.ai"
            , mapValue = { name = "Felo", selectors = [ "textarea" ] }
            }
          , { mapKey = "manus.im"
            , mapValue = { name = "Manus", selectors = [ "textarea" ] }
            }
          , { mapKey = "bolt.new"
            , mapValue = { name = "Bolt", selectors = [ "textarea" ] }
            }
          , { mapKey = "drive.google.com"
            , mapValue =
              { name = "Gemini in Google drive"
              , selectors = [ "div[aria-label='ここにプロンプトを入力']" ]
              }
            }
          , { mapKey = "poe.com"
            , mapValue = { name = "Poe", selectors = [ "textarea" ] }
            }
          , { mapKey = "chat.mistral.ai"
            , mapValue = { name = "Mistral AI", selectors = [ "textarea" ] }
            }
          , { mapKey = "you.com"
            , mapValue = { name = "You.com", selectors = [ "textarea" ] }
            }
          , { mapKey = "dashboard.cohere.com"
            , mapValue = { name = "Cohere Playground", selectors = [ "textarea" ] }
            }
          , { mapKey = "copilot.microsoft.com"
            , mapValue = { name = "Microsoft Copilot", selectors = [ "textarea" ] }
            }
          , { mapKey = "www.phind.com"
            , mapValue =
              { name = "Phind"
              , selectors = [ "div.public-DraftEditor-content[contenteditable='true']" ]
              }
            }
          , { mapKey = "chat.deepseek.com"
            , mapValue = { name = "DeepSeek", selectors = [ "#chat-input" ] }
            }
          , { mapKey = "grok.com"
            , mapValue = { name = "Grok", selectors = [ "textarea" ] }
            }
          -- Online Meeting Tool
          , { mapKey = "meet.google.com"
            , mapValue = { name = "Google Meet", selectors = [ "textarea" ] }
            }
          ]
      }

in  config
