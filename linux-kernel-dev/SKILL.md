---
name: linux-kernel-dev
description: "Linux kernel development: modules, drivers, KASAN, ftrace, lockdep, perf, crash debugging. Kernel-space and kernel/driver boundary work."
compatibility: opencode
metadata:
  loading: on-demand
  auto_unload: true
  trigger_keywords: ["Linux kernel", "kernel module", "driver", "KASAN", "ftrace", "lockdep", "perf", "crash", "kdump", "kselftest", "kunit", "slabinfo", "vmstat"]
---

# Linux Kernel Development

**Kernel-space and kernel/driver boundary work.**

---

## Mandatory Capture

```
Kernel version: 6.10.0 / commit abc123
Architecture: x86_64 / arm64
Config: defconfig + CONFIG_DEBUG_INFO=y + CONFIG_KASAN=y
Hardware: CPU model, firmware, exact device
Boot params: cmdline, initrd, secure boot state
Reproducer: exact steps, dmesg snippet, crash dump
```

## Subsystem Localisation

| Subsystem | Tools | Key Checks |
|-----------|-------|------------|
| **Memory/MM** | `kmemleak`, KASAN, `slabinfo`, `vmstat` | Page allocation, compound pages, page migration, NUMA |
| **Scheduler** | `schedstat`, `perf sched`, tracepoints | CFS, RT, DL, wakeup latency, affinity |
| **Block/IO** | `blktrace`, `btt`, `iolatency` | Request queue, elevator, bio splitting, flush |
| **Network** | `tcpdump`, `dropmonitor`, `netdevsim` | SKB lifecycle, NAPI, XDP, TC |
| **Drivers** | `devlink`, `dmesg -T`, `lsmod` | Probe order, PM runtime, MSI/MSI-X, DMA mapping |
| **Locking** | `lockdep`, `lockstat`, `mutex_debug` | Lock ordering, deadlock, IRQ safety, RCU grace periods |

## Debugging Workflow

```bash
# 1. Early boot: qemu + GDB
qemu-system-x86_64 -kernel bzImage -initrd initrd.img -s -S -append "earlyprintk=serial"

# 2. Runtime: ftrace
echo function > /sys/kernel/debug/tracing/current_tracer
echo schedule > /sys/kernel/debug/tracing/set_ftrace_filter
cat /sys/kernel/debug/tracing/trace

# 3. Crash: kdump + crash
crash vmlinux /var/crash/vmcore

# 4. Memory: KASAN
# Requires a kernel built with the appropriate CONFIG_KASAN settings.
# Consult the target kernel's config and boot documentation. There is no
# universal runtime debugfs toggle for enabling KASAN on any kernel.
# Reproduce the issue and inspect dmesg for its report and stack.

# 5. Locking: lockdep
# Requires a kernel built with CONFIG_LOCKDEP / CONFIG_PROVE_LOCKING as needed.
# Reproduce the issue and inspect lockdep reports in dmesg. A debugfs echo
# cannot enable a feature omitted at kernel build time.
```

## Module Development

The example is a **minimal read-only character-device module**, not a hardware or PCI driver. It intentionally defines no write operation. For real hardware, use the relevant kernel subsystem and follow the official driver lifecycle, including resource ownership, DMA, interrupts and teardown.

```c
#include <linux/fs.h>
#include <linux/init.h>
#include <linux/miscdevice.h>
#include <linux/module.h>

#define DEVICE_NAME "mydev"

static const char message[] = "mydev: ready\\n";

static ssize_t my_read(struct file *file, char __user *buffer,
                       size_t count, loff_t *position)
{
    return simple_read_from_buffer(buffer, count, position,
                                   message, sizeof(message) - 1);
}

static const struct file_operations my_fops = {
    .owner  = THIS_MODULE,
    .read   = my_read,
    .llseek = default_llseek,
};

static struct miscdevice my_device = {
    .minor = MISC_DYNAMIC_MINOR,
    .name  = DEVICE_NAME,
    .fops  = &my_fops,
    .mode  = 0444, /* Read-only device node. */
};

static int __init my_init(void)
{
    return misc_register(&my_device);
}

static void __exit my_exit(void)
{
    misc_deregister(&my_device);
}

module_init(my_init);
module_exit(my_exit);
MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Minimal read-only misc device");
```

Do not extend a scaffold by adding function pointers to undefined callbacks. For mutable device state, add explicit locking, bounds checks, user-copy error handling, lifetime rules and concurrency tests before exposing write operations.

## Validation Gates

Set `KDIR` to the build tree for the exact target kernel version/configuration. Some checks require kernel configuration options unavailable in a distribution kernel. Mark them BLOCKED or NOT RUN when unavailable, not PASS.

| Gate | Command | Pass Criteria |
|------|---------|---------------|
| **Build** | `make -C "$KDIR" M="$PWD" W=1 modules` (set KDIR to the matching target kernel build tree) | 0 warnings (or documented) |
| **Static** | `make -C "$KDIR" M="$PWD" C=2 CF="-Wbitwise -Wcontext" modules` | 0 new warnings |
| **KASAN** | Build/boot a kernel with the required KASAN configuration; use supported boot options for that kernel | No splats on reproducer |
| **Lockdep** | Use a kernel built with `CONFIG_LOCKDEP` and supported debug options | No splats on reproducer |
| **Reproducer** | `sudo insmod mydev.ko && cat /dev/mydev && sudo rmmod mydev` | Expected behavior |
| **Regression** | `kselftest / kunit` | All pass |

## Boundaries

- Does not write userspace C/C++ (see `c-systems`)
- Does not manage userspace memory allocators (see `linux-user`)
- Does not cover bare-metal kernel (see `bare-metal-kernel`)
- Does not cover x86 architecture (see `x86-arch`)
- Does not cover memory management (see `memory-mgmt`)
- `stop linux-kernel-dev`: revert.